// Dựng app Express: bảo mật, CORS, session, các nhóm API và Swagger.
// Ở production thì phục vụ luôn bản build của React.
import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { securityHeaders } from './middleware/security.js';
import cors from 'cors';
import pool from './db/pool.js';
import { createSessionMiddleware } from './config/session.js';
import tourRoutes from './routes/tourRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import swaggerUi from 'swagger-ui-express';
import openapi from './docs/openapi.js';

// Tách khỏi server.js để Vercel (api/index.js) dùng lại được.
export function createApp() {
  const app = express();
  // giấu "X-Powered-By" cho đỡ lộ đang dùng Express
  app.disable('x-powered-by');
  const production = process.env.NODE_ENV === 'production';
  // production mà CLIENT_URL không phải https thì dừng luôn
  if (production && (!process.env.CLIENT_URL || new URL(process.env.CLIENT_URL).protocol !== 'https:')) {
    throw new Error('Production requires an HTTPS CLIENT_URL.');
  }
  // production bắt buộc SSL tới DB (Neon đòi vậy)
  if (production && process.env.DATABASE_SSL !== 'true') throw new Error('Production requires DATABASE_SSL=true.');
  // header bảo mật, xem middleware/security.js
  app.use(securityHeaders);
  // origin của frontend, vd http://localhost:5173
  app.locals.clientOrigin = new URL(process.env.CLIENT_URL || 'http://localhost:5173').origin;
  // Render có proxy đứng trước, cần dòng này mới thấy đúng HTTPS và IP khách
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

  // các origin được gọi API
  const allowedOrigins = new Set([app.locals.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173']);
  // Trên Vercel: tự nhận domain chính của project và link riêng của bản deploy đang chạy,
  // để mở bằng link nào của Vercel cũng đăng nhập được (Vercel tự cấp hai biến này).
  for (const host of [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]) {
    if (host) allowedOrigins.add(`https://${host}`);
  }

  app.locals.allowedOrigins = allowedOrigins;

  // chạy local thì nhận mọi cổng localhost, vì Vite hay nhảy sang 5174, 5175 khi 5173 bận
  // production chỉ nhận origin trong danh sách trên
  const localDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/;
  const isAllowedOrigin = (origin) => allowedOrigins.has(origin) || (!production && localDevOrigin.test(origin));
  app.locals.isAllowedOrigin = isAllowedOrigin;

  app.use(
    cors({
      origin(origin, callback) {
        // không có origin (cùng domain, curl, Postman) thì cho qua
        if (!origin || isAllowedOrigin(origin)) {
          return callback(null, true);
        }

        // gắn 403 để lỗi này không bị tính là 500
        return callback(Object.assign(new Error(`Origin not allowed by CORS: ${origin}`), { status: 403 }));
      },
      // cho gửi cookie đăng nhập
      credentials: true,
    }),
  );

  // bài blog dài hơn form thường nên riêng đường này cho tới 256KB
  app.use('/api/admin/posts', express.json({ limit: '256kb' }));
  // body JSON tối đa 32KB
  app.use(express.json({ limit: '32kb' }));
  // session lưu trong Postgres
  const { middleware, store } = createSessionMiddleware();
  app.locals.sessionStore = store;
  app.use(middleware);

  // GET /api/health: xem backend và DB còn sống không
  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        message: 'Backend đang chạy',
        database: 'PostgreSQL đã kết nối',
      });
    } catch (error) {
      console.error('Lỗi kiểm tra database:', error.code);
      res.status(503).json({ message: 'Chưa kết nối được PostgreSQL' });
    }
  });

  // mỗi file trong routes/ lo một nhóm API
  app.use('/api/tours', tourRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/recommendations', recommendationRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/blog', blogRoutes);
  // tài liệu API: /api-docs.json và giao diện Swagger ở /api-docs
  app.get('/api-docs.json', (req, res) => {
    res.json(openapi);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openapi, {
      customSiteTitle: 'Travel Mint API Documentation',
      swaggerOptions: {
        validatorUrl: null,
        // chỉ cho bấm thử API GET, API ghi thì chỉ để xem
        supportedSubmitMethods: ['get'],
      },
    }),
  );

  // /api/... nào không khớp thì 404
  app.use('/api', (req, res) => res.status(404).json({ message: 'Đường dẫn API không tồn tại' }));
  // production: server phục vụ luôn bản build của React, cùng một domain.
  // Trên Vercel (có biến VERCEL) thì không: Vercel tự phục vụ client/dist, Express chỉ lo /api.
  // SERVE_CLIENT=true/false ghi đè mặc định này.
  const serveClient = process.env.SERVE_CLIENT
    ? process.env.SERVE_CLIENT === 'true'
    : production && !process.env.VERCEL;
  if (serveClient) {
    const clientDist = fileURLToPath(new URL('../../client/dist/', import.meta.url));
    if (!existsSync(path.join(clientDist, 'index.html')))
      throw new Error('Run npm run build in client before serving the website.');
    // file tĩnh: js, css, ảnh
    app.use(express.static(clientDist, { index: false }));
    // đường dẫn trang như /tours/5 thì trả index.html cho React Router lo
    app.get(/.*/, (req, res, next) => {
      if (path.extname(req.path) || !req.accepts('html')) return next();
      res.set('Cache-Control', 'no-cache').sendFile(path.join(clientDist, 'index.html'));
    });
  }
  app.use((req, res) => res.status(404).json({ message: 'Đường dẫn không tồn tại' }));
  // bắt lỗi chung, không để lộ chi tiết ra ngoài
  app.use((error, req, res, next) => {
    console.error('Lỗi xử lý API:', error.code || error.name);
    // origin lạ bị CORS chặn ở trên
    if (error.status === 403) return res.status(403).json({ message: 'Nguồn gửi yêu cầu không được chấp nhận.' });
    // 400 body sai định dạng, 413 body quá lớn, còn lại coi là 500
    const status = [400, 413].includes(error.status) ? error.status : 500;
    res.status(status).json({
      message:
        status === 500 ? 'Có lỗi phía máy chủ. Vui lòng thử lại.' : 'Nội dung yêu cầu không hợp lệ hoặc quá lớn.',
    });
  });
  return app;
}
