import pool from './pool.js';

// Chạy nhiều câu SQL trong một transaction, lỗi giữa chừng thì hủy hết.
// withTransaction(async (client) => { await client.query(...); })
// nhớ dùng đúng cái client được truyền vào, đừng dùng pool trong này
export async function withTransaction(work) {
  const client = await pool.connect();
  let releaseError;
  try {
    await client.query('BEGIN');
    // chờ khóa quá 5 giây hoặc chạy quá 10 giây thì bỏ, khỏi treo cả hệ thống
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '10s'");
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      releaseError = rollbackError;
    }
    throw error;
  } finally {
    // rollback mà lỗi thì vứt luôn kết nối này, đừng trả lại pool
    client.release(releaseError);
  }
}
