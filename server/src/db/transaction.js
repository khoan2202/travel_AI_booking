import pool from './pool.js';

// Hàm chạy nhiều câu SQL trong một transaction: hoặc tất cả thành công, hoặc hủy hết.
// Cách dùng: withTransaction(async (client) => { await client.query(...); ... })
// Mọi câu SQL của một transaction phải dùng CÙNG client.
export async function withTransaction(work) {
  // Mượn một kết nối riêng từ pool.
  const client = await pool.connect();
  let releaseError;
  try {
    await client.query('BEGIN');
    // Chờ khóa dòng tối đa 5 giây, chạy mỗi câu tối đa 10 giây (chỉ trong transaction này).
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '10s'");
    // Chạy phần việc được truyền vào.
    const result = await work(client);
    // Không có lỗi thì lưu toàn bộ thay đổi.
    await client.query('COMMIT');
    return result;
  } catch (error) {
    // Có lỗi thì hoàn tác mọi thay đổi trong transaction.
    try { await client.query('ROLLBACK'); }
    catch (rollbackError) { releaseError = rollbackError; }
    throw error;
  } finally {
    // Trả kết nối về pool. Nếu rollback lỗi thì hủy luôn kết nối đó.
    client.release(releaseError);
  }
}
