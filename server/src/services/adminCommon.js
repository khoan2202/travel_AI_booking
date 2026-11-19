// Đồ nghề dùng chung cho các route: kiểm tra dữ liệu, ghi nhật ký, bắt lỗi. Lỗi nào cũng mang kèm mã HTTP (400, 404, 409...).
export class AdminError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
// điều kiện sai thì ném lỗi, request dừng tại đó
export function check(condition, message, status = 400) {
  if (!condition) throw new AdminError(status, message);
}
// số nguyên trong khoảng [min, max]
export function integer(value, min = 1, max = 2147483647) {
  return (
    typeof value !== 'boolean' &&
    /^\d+$/.test(String(value)) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) >= min &&
    Number(value) <= max
  );
}
// chuỗi: cắt khoảng trắng hai đầu rồi kiểm tra độ dài
export function text(value, min, max, label) {
  check(typeof value === 'string', `${label} chưa hợp lệ.`);
  const result = value.trim();
  check(result.length >= min && result.length <= max, `${label} cần từ ${min} đến ${max} ký tự.`);
  return result;
}
// YYYY-MM-DD và phải là ngày có thật (2024-02-31 thì loại)
export function date(value) {
  check(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Ngày phải có dạng YYYY-MM-DD.');
  const parsed = new Date(value + 'T00:00:00Z');
  check(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, 'Ngày không tồn tại.');
  return value;
}
// ghi nhật ký admin: ai làm gì với cái gì
export async function audit(client, userId, action, type, id, details = {}) {
  await client.query(
    'INSERT INTO admin_audit_logs(actor_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)',
    [userId, action, type, id, JSON.stringify(details)],
  );
}
// bọc route lại, lỗi nào cũng đổi thành câu trả lời dễ hiểu
export function handle(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof AdminError) return res.status(error.status).json({ message: error.message });
      // đổi mã lỗi Postgres thành câu dễ hiểu: 23505 trùng, 23503/23514/22003 sai dữ liệu,
      // 55P03/40P01/57014 đang bận, 42P01 chưa có bảng (chưa chạy SQL mới)
      if (error.code === '42P01')
        return res
          .status(503)
          .json({ message: 'Database chưa có bảng cho chức năng này. Hãy chạy file SQL mới nhất trong server/sql.' });
      if (error.code === '23505')
        return res.status(409).json({ message: 'Slug hoặc ngày khởi hành đã tồn tại. Hãy kiểm tra lại.' });
      if (['23503', '23514', '22003'].includes(error.code))
        return res.status(400).json({ message: 'Dữ liệu tham chiếu hoặc giá trị chưa hợp lệ.' });
      if (['55P03', '40P01', '57014'].includes(error.code))
        return res.status(503).json({ message: 'Dữ liệu đang được cập nhật. Vui lòng thử lại.' });
      next(error);
    }
  };
}
