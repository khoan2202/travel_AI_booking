// Các hàm dùng chung cho API admin (và một số API khác): kiểm tra dữ liệu, ghi log, bắt lỗi.
// Lỗi nghiệp vụ có mã HTTP đi kèm, ví dụ 400, 404, 409.
export class AdminError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
// check(điều kiện, thông báo): điều kiện sai thì ném lỗi, request dừng tại đó.
export function check(condition, message, status = 400) {
  if (!condition) throw new AdminError(status, message);
}
// integer(): kiểm tra giá trị là số nguyên nằm trong khoảng [min, max].
export function integer(value, min = 1, max = 2147483647) {
  return typeof value !== 'boolean' && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
}
// text(): kiểm tra chuỗi, cắt khoảng trắng hai đầu và kiểm tra độ dài.
export function text(value, min, max, label) {
  check(typeof value === 'string', `${label} chưa hợp lệ.`);
  const result = value.trim(); check(result.length >= min && result.length <= max, `${label} cần từ ${min} đến ${max} ký tự.`); return result;
}
// date(): kiểm tra ngày dạng YYYY-MM-DD và ngày đó có thật (loại 2024-02-31).
export function date(value) {
  check(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Ngày phải có dạng YYYY-MM-DD.');
  const parsed = new Date(value + 'T00:00:00Z');
  check(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, 'Ngày không tồn tại.'); return value;
}
// audit(): ghi nhật ký thao tác của admin vào bảng admin_audit_logs.
export async function audit(client, userId, action, type, id, details = {}) {
  await client.query('INSERT INTO admin_audit_logs(actor_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [userId, action, type, id, JSON.stringify(details)]);
}
// handle(): bọc hàm xử lý route, tự chuyển lỗi thành response dễ hiểu.
export function handle(fn) {
  return async (req, res, next) => {
    try { await fn(req, res); }
    catch (error) {
      if (error instanceof AdminError) return res.status(error.status).json({ message: error.message });
      // Đổi mã lỗi PostgreSQL thành thông báo cho người dùng:
      // 23505 trùng dữ liệu UNIQUE; 23503/23514/22003 sai khóa ngoại, vi phạm CHECK hoặc số quá lớn;
      // 55P03/40P01/57014 đang bận (khóa, deadlock, quá giờ).
      if (error.code === '23505') return res.status(409).json({ message: 'Slug hoặc ngày khởi hành đã tồn tại. Hãy kiểm tra lại.' });
      if (['23503', '23514', '22003'].includes(error.code)) return res.status(400).json({ message: 'Dữ liệu tham chiếu hoặc giá trị chưa hợp lệ.' });
      if (['55P03', '40P01', '57014'].includes(error.code)) return res.status(503).json({ message: 'Dữ liệu đang được cập nhật. Vui lòng thử lại.' });
      next(error);
    }
  };
}
