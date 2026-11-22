// Pool kết nối Postgres dùng chung cho cả backend (giữ sẵn vài kết nối cho nhanh).
import 'dotenv/config';
import pg from 'pg';

// production hoặc DATABASE_SSL=true thì bật SSL (Neon bắt buộc)
const useSSL = process.env.NODE_ENV === 'production' || process.env.DATABASE_SSL?.trim().toLowerCase() === 'true';

// Hai cách khai báo kết nối: các biến PGHOST, PGUSER... (ưu tiên), hoặc một DATABASE_URL
// (tích hợp Neon trên Vercel tự tạo biến này).
const connection = process.env.PGHOST
  ? {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
    }
  : { connectionString: process.env.DATABASE_URL };

const pool = new pg.Pool({
  ...connection,

  // true = có kiểm tra chứng chỉ của DB
  ssl: useSSL ? { rejectUnauthorized: true } : false,

  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  // mỗi câu SQL tối đa 10 giây
  statement_timeout: 10000,
  // giờ Việt Nam cho mọi kết nối
  options: '-c timezone=Asia/Ho_Chi_Minh',
});

// kết nối đang rảnh mà đứt (vd DB khởi động lại) thì chỉ ghi log
pool.on('error', (error) => {
  console.error('PostgreSQL idle connection error:', {
    code: error.code,
    message: error.message,
  });
});

export default pool;
