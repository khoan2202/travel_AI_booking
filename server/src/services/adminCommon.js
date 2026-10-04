export class AdminError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function check(condition, message, status = 400) {
  if (!condition) throw new AdminError(status, message);
}
export function integer(value, min = 1, max = 2147483647) {
  return typeof value !== 'boolean' && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
}
export function text(value, min, max, label) {
  check(typeof value === 'string', `${label} chưa hợp lệ.`);
  const result = value.trim(); check(result.length >= min && result.length <= max, `${label} cần từ ${min} đến ${max} ký tự.`); return result;
}
export function date(value) {
  check(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Ngày phải có dạng YYYY-MM-DD.');
  const parsed = new Date(value + 'T00:00:00Z');
  check(Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value, 'Ngày không tồn tại.'); return value;
}
export async function audit(client, userId, action, type, id, details = {}) {
  await client.query('INSERT INTO admin_audit_logs(actor_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5)', [userId, action, type, id, JSON.stringify(details)]);
}
export function handle(fn) {
  return async (req, res, next) => {
    try { await fn(req, res); }
    catch (error) {
      if (error instanceof AdminError) return res.status(error.status).json({ message: error.message });
      if (error.code === '23505') return res.status(409).json({ message: 'Slug hoặc ngày khởi hành đã tồn tại. Hãy kiểm tra lại.' });
      if (['23503', '23514', '22003'].includes(error.code)) return res.status(400).json({ message: 'Dữ liệu tham chiếu hoặc giá trị chưa hợp lệ.' });
      if (['55P03', '40P01', '57014'].includes(error.code)) return res.status(503).json({ message: 'Dữ liệu đang được cập nhật. Vui lòng thử lại.' });
      next(error);
    }
  };
}
