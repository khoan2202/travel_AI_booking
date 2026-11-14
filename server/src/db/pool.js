// Tạo "pool" kết nối PostgreSQL dùng chung cho cả backend.
// Pool giữ sẵn vài kết nối để tái sử dụng, nhanh hơn mở kết nối mới cho mỗi câu SQL.
import pg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';

const isWorker = process.env.CLOUDFLARE_WORKER === 'true';
const requestClientStorage = isWorker ? new AsyncLocalStorage() : null;

// Bật SSL khi chạy production hoặc khi DATABASE_SSL=true (Neon bắt buộc SSL).
const useSSL =
  process.env.NODE_ENV === 'production' ||
  process.env.DATABASE_SSL?.trim().toLowerCase() === 'true';

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      // Thông tin kết nối lấy từ server/.env.
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,

      // rejectUnauthorized: true = kiểm tra chứng chỉ SSL của server database.
      ssl: useSSL ? { rejectUnauthorized: true } : false,
  };

const workerPool = {
  // Every Worker invocation supplies its own pg Client through AsyncLocalStorage.
  // Hyperdrive owns the reusable database-side pool; don't keep a pg Pool globally.
  query(...args) {
    const client = requestClientStorage.getStore();
    if (!client) throw new Error('No request-scoped PostgreSQL client is active.');
    return client.query(...args);
  },
  async connect() {
    const client = requestClientStorage.getStore();
    if (!client) throw new Error('No request-scoped PostgreSQL client is active.');
    return { query: (...args) => client.query(...args), release() {} };
  },
  on() {
    // Pool-style error listeners are used by connect-pg-simple. The current
    // request-scoped Client reports query errors through the awaiting handler.
    return this;
  },
};

const pool = isWorker
  ? workerPool
  : new pg.Pool({
      ...poolConfig,
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

if (!isWorker) {
  // Ghi log khi một kết nối đang rảnh bị lỗi (ví dụ database khởi động lại).
  pool.on('error', (error) => {
    console.error('PostgreSQL idle connection error:', {
      code: error.code,
      message: error.message,
    });
  });
}

export async function withRequestDatabaseClient(connectionString, run) {
  if (!isWorker) return run();
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
    options: '-c timezone=Asia/Ho_Chi_Minh',
  });
  try {
    await client.connect();
  } catch (error) {
    console.error('Cloudflare PostgreSQL connection failed:', error.code || error.name);
    return new Response(
      JSON.stringify({ message: 'Chưa kết nối được cơ sở dữ liệu. Vui lòng thử lại.' }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      },
    );
  }
  // Hyperdrive automatically releases the edge-side client when the Worker
  // invocation ends; explicitly ending it can race the node HTTP adapter.
  return requestClientStorage.run(client, () => run(client));
}

export default pool;
