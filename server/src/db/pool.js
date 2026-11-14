// Tạo "pool" kết nối PostgreSQL dùng chung cho cả backend.
// Pool giữ sẵn vài kết nối để tái sử dụng, nhanh hơn mở kết nối mới cho mỗi câu SQL.
import 'dotenv/config';
import pg from 'pg';

// Bật SSL khi chạy production hoặc khi DATABASE_SSL=true (Neon bắt buộc SSL).
const useSSL =
  process.env.NODE_ENV === 'production' ||
  process.env.DATABASE_SSL?.trim().toLowerCase() === 'true';

const pool = new pg.Pool({
  // Thông tin kết nối lấy từ server/.env.
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,

  // rejectUnauthorized: true = kiểm tra chứng chỉ SSL của server database.
  ssl: useSSL ? { rejectUnauthorized: true } : false,

  // Tối đa 10 kết nối cùng lúc.
  max: 10,
  // Chờ mở kết nối tối đa 10 giây.
  connectionTimeoutMillis: 10000,
  // Kết nối rảnh quá 30 giây thì đóng.
  idleTimeoutMillis: 30000,
  // Mỗi câu SQL chạy tối đa 10 giây.
  statement_timeout: 10000,
  // Dùng múi giờ Việt Nam cho mọi kết nối.
  options: '-c timezone=Asia/Ho_Chi_Minh',
});

// Ghi log khi một kết nối đang rảnh bị lỗi (ví dụ database khởi động lại).
pool.on('error', (error) => {
  console.error('PostgreSQL idle connection error:', {
    code: error.code,
    message: error.message,
  });
});

export default pool;