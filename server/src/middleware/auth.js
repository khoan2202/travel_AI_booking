// Chặn người chưa đăng nhập, và người không phải admin.
import pool from '../db/pool.js';
import { COOKIE_NAME, cookieOptions } from '../config/session.js';

export async function requireAuth(req, res, next) {
  if (!Number.isInteger(req.session?.userId)) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để tiếp tục.' });
  }
  try {
    // quyền đọc lại từ DB mỗi lần, không tin gì từ phía trình duyệt
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.session.userId]);
    // tài khoản đã bị xóa thì hủy luôn phiên
    if (!result.rows[0]) {
      await new Promise((resolve, reject) => req.session.destroy((err) => (err ? reject(err) : resolve())));
      res.clearCookie(COOKIE_NAME, cookieOptions);
      return res.status(401).json({ message: 'Phiên đăng nhập không còn hợp lệ.' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

// phải đặt sau requireAuth
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng quản trị.' });
  }
  next();
}
