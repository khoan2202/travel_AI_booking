import pool from './pool.js';

// Mọi câu SQL của một transaction phải dùng CÙNG client.
export async function withTransaction(work) {
  const client = await pool.connect();
  let releaseError;
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '10s'");
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); }
    catch (rollbackError) { releaseError = rollbackError; }
    throw error;
  } finally {
    client.release(releaseError);
  }
}
