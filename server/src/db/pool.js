import 'dotenv/config';
import pg from 'pg';

const useSSL =
  process.env.NODE_ENV === 'production' ||
  process.env.DATABASE_SSL?.trim().toLowerCase() === 'true';

const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,

  ssl: useSSL ? { rejectUnauthorized: true } : false,

  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  statement_timeout: 10000,
  options: '-c timezone=Asia/Ho_Chi_Minh',
});

pool.on('error', (error) => {
  console.error('PostgreSQL idle connection error:', {
    code: error.code,
    message: error.message,
  });
});

export default pool;