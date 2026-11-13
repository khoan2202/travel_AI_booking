// Điểm khởi động của backend: kiểm tra database, mở cổng và lắng nghe request.
// Chạy bằng: npm run dev (local) hoặc npm start (production).
// Nạp biến môi trường từ file server/.env vào process.env.
import 'dotenv/config';
import { createApp } from './app.js';
import pool from './db/pool.js';

try {
  // Tạo ứng dụng Express với đầy đủ middleware và route (xem app.js).
  const app = createApp();
  // Fail before accepting traffic if the required migrations are missing.
  const tables = ['users', 'user_sessions', 'tours', 'tour_departures', 'bookings', 'admin_audit_logs', 'booking_payment_events'];
  // Kiểm tra từng bảng có tồn tại không; thiếu bảng nào thì dừng ngay và báo lỗi.
  for (const table of tables) {
    const result = await pool.query('SELECT to_regclass($1) AS name', ['public.' + table]);
    if (!result.rows[0].name) throw new Error('Missing required database migration: ' + table);
  }
  // Render tự cấp PORT; chạy local thì mặc định cổng 5000.
  const port = Number(process.env.PORT) || 5000;
  const server = app.listen(port, '0.0.0.0', () => console.log(`Travel Mint listening on port ${port}`));
  // Tắt server "êm": ngừng nhận request mới, xử lý nốt request đang chạy rồi mới thoát.
  let stopping = false;
  const shutdown = () => {
    if (stopping) return; stopping = true;
    // Quá 10 giây mà chưa tắt xong thì buộc thoát.
    const timeout = setTimeout(() => process.exit(1), 10000); timeout.unref();
    server.close(async () => {
      // Đóng kho lưu phiên đăng nhập và các kết nối database trước khi thoát.
      await app.locals.sessionStore.close(); await pool.end(); clearTimeout(timeout); process.exit(0);
    });
    server.closeIdleConnections();
  };
  // SIGTERM: Render gửi khi deploy bản mới; SIGINT: khi bấm Ctrl+C.
  process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
} catch (error) {
    // Mọi lỗi lúc khởi động (sai .env, không nối được DB...) đều in ra đây với tiền tố "Startup failed".
    console.error('Startup failed:', {
    code: error.code,
    message: error.message,
  }); 
  await pool.end(); 
  process.exit(1);
}
