// Chỗ khởi động backend: kiểm tra DB rồi mở cổng. npm run dev (local) hoặc npm start (production).
// dòng dưới nạp server/.env
import 'dotenv/config';
import { createApp } from './app.js';
import pool from './db/pool.js';

try {
  const app = createApp();
  // thiếu bảng bắt buộc thì dừng ngay, chưa nhận request nào
  const tables = [
    'users',
    'user_sessions',
    'tours',
    'tour_departures',
    'bookings',
    'admin_audit_logs',
    'booking_payment_events',
  ];
  for (const table of tables) {
    const result = await pool.query('SELECT to_regclass($1) AS name', ['public.' + table]);
    if (!result.rows[0].name) throw new Error('Missing required database migration: ' + table);
  }
  // Render tự cấp PORT, local thì 5000
  const port = Number(process.env.PORT) || 5000;
  const server = app.listen(port, '0.0.0.0', () => console.log(`Travel Mint listening on port ${port}`));
  // tắt êm: ngừng nhận request mới, làm nốt cái đang chạy rồi mới thoát
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    // quá 10 giây chưa xong thì thoát cưỡng bức
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      // đóng kho phiên và kết nối DB trước khi thoát
      await app.locals.sessionStore.close();
      await pool.end();
      clearTimeout(timeout);
      process.exit(0);
    });
    server.closeIdleConnections();
  };
  // SIGTERM do Render gửi khi deploy bản mới, SIGINT là Ctrl+C
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  // lỗi lúc khởi động (sai .env, không nối được DB...) sẽ in ra đây
  console.error('Startup failed:', {
    code: error.code,
    message: error.message,
  });
  await pool.end();
  process.exit(1);
}
