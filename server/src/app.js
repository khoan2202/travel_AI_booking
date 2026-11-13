// Tạo và cấu hình ứng dụng Express: bảo mật, CORS, session, các nhóm API, Swagger,
// và (trên production) phục vụ luôn giao diện React đã build trong client/dist.
import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { securityHeaders } from "./middleware/security.js";
import cors from "cors";
import pool from "./db/pool.js";
import { createSessionMiddleware } from "./config/session.js";
import tourRoutes from "./routes/tourRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import swaggerUi from "swagger-ui-express";
import openapi from "./docs/openapi.js";

// Hàm tạo app. Tách riêng khỏi server.js để dễ kiểm thử và khởi động.
export function createApp() {
  const app = express();
  // Ẩn header "X-Powered-By: Express" để không lộ công nghệ đang dùng.
  app.disable("x-powered-by");
  const production = process.env.NODE_ENV === "production";
  // Production bắt buộc CLIENT_URL là https, nếu không thì dừng luôn.
  if (
    production &&
    (!process.env.CLIENT_URL ||
      new URL(process.env.CLIENT_URL).protocol !== "https:")
  ) {
    throw new Error("Production requires an HTTPS CLIENT_URL.");
  }
  // Production bắt buộc bật SSL khi kết nối database (Neon yêu cầu).
  if (production && process.env.DATABASE_SSL !== "true")
    throw new Error("Production requires DATABASE_SSL=true.");
  // Thêm các header bảo mật cho mọi response (xem middleware/security.js).
  app.use(securityHeaders);
  // Địa chỉ gốc của frontend, ví dụ http://localhost:5173.
  app.locals.clientOrigin = new URL(
    process.env.CLIENT_URL || "http://localhost:5173",
  ).origin;
  // Trên Render, request đi qua proxy; dòng này giúp Express nhận đúng HTTPS và IP thật.
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

  // Danh sách các địa chỉ frontend được phép gọi API.
  const allowedOrigins = new Set([
    app.locals.clientOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);

  app.locals.allowedOrigins = allowedOrigins;

  // CORS: chỉ cho phép trình duyệt từ các origin trong danh sách gọi API.
  app.use(
    cors({
      origin(origin, callback) {
        // Không có origin (gọi cùng domain, Postman, curl...) hoặc origin hợp lệ thì cho qua.
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      // Cho phép gửi kèm cookie phiên đăng nhập.
      credentials: true,
    }),
  );

  // Đọc body JSON của request, giới hạn 32KB để chống gửi dữ liệu quá lớn.
  app.use(express.json({ limit: "32kb" }));
  // Gắn session (phiên đăng nhập lưu trong PostgreSQL) vào mọi request.
  const { middleware, store } = createSessionMiddleware();
  app.locals.sessionStore = store;
  app.use(middleware);

  // API kiểm tra nhanh backend và database còn sống không: GET /api/health.
  app.get("/api/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        message: "Backend đang chạy",
        database: "PostgreSQL đã kết nối",
      });
    } catch (error) {
      console.error("Lỗi kiểm tra database:", error.code);
      res.status(503).json({ message: "Chưa kết nối được PostgreSQL" });
    }
  });

  // Gắn các nhóm API theo đường dẫn. Mỗi file route xử lý một nhóm chức năng.
  app.use("/api/tours", tourRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/recommendations", recommendationRoutes);
  app.use("/api/support", supportRoutes);
  // Tài liệu API: /api-docs.json (dạng JSON) và /api-docs (giao diện Swagger).
  app.get("/api-docs.json", (req, res) => {
  res.json(openapi);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: "Travel Mint API Documentation",
    swaggerOptions: {
      validatorUrl: null,
      // Chỉ cho thử API GET trực tiếp trong tài liệu.
      // API ghi dữ liệu vẫn được hiển thị đầy đủ.
      supportedSubmitMethods: ["get"],
    },
  }),
);

  // Mọi đường dẫn /api/... không khớp route nào ở trên thì trả 404.
  app.use("/api", (req, res) =>
    res.status(404).json({ message: "Đường dẫn API không tồn tại" }),
  );
  // Production: server phục vụ luôn file giao diện React đã build (cùng một domain).
  if (production || process.env.SERVE_CLIENT === "true") {
    const clientDist = fileURLToPath(
      new URL("../../client/dist/", import.meta.url),
    );
    if (!existsSync(path.join(clientDist, "index.html")))
      throw new Error(
        "Run npm run build in client before serving the website.",
      );
    // Trả các file tĩnh (js, css, ảnh) trong client/dist.
    app.use(express.static(clientDist, { index: false }));
    // Các đường dẫn trang (ví dụ /tours/5) đều trả index.html để React Router tự xử lý.
    app.get(/.*/, (req, res, next) => {
      if (path.extname(req.path) || !req.accepts("html")) return next();
      res
        .set("Cache-Control", "no-cache")
        .sendFile(path.join(clientDist, "index.html"));
    });
  }
  // Không khớp gì cả thì trả 404.
  app.use((req, res) =>
    res.status(404).json({ message: "Đường dẫn không tồn tại" }),
  );
  // Bộ bắt lỗi chung: lỗi nào lọt tới đây đều trả thông báo chung, không lộ chi tiết.
  app.use((error, req, res, next) => {
    console.error("Lỗi xử lý API:", error.code || error.name);
    // 400 = body sai định dạng, 413 = body quá lớn; các lỗi còn lại tính là 500.
    const status = [400, 413].includes(error.status) ? error.status : 500;
    res
      .status(status)
      .json({
        message:
          status === 500
            ? "Có lỗi phía máy chủ. Vui lòng thử lại."
            : "Nội dung yêu cầu không hợp lệ hoặc quá lớn.",
      });
  });
  return app;
}
