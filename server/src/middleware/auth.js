import pool from "../db/pool.js";
import { COOKIE_NAME, cookieOptions } from "../config/session.js";

export async function requireAuth(req, res, next) {
  if (!Number.isInteger(req.session?.userId)) {
    return res.status(401).json({ message: "Bạn cần đăng nhập để tiếp tục." });
  }
  try {
    // Đọc quyền mới nhất từ database, không tin role do frontend gửi lên.
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [req.session.userId]
    );
    if (!result.rows[0]) {
      await new Promise((resolve, reject) => req.session.destroy((err) => err ? reject(err) : resolve()));
      res.clearCookie(COOKIE_NAME, cookieOptions);
      return res.status(401).json({ message: "Phiên đăng nhập không còn hợp lệ." });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Bạn không có quyền truy cập chức năng quản trị." });
  }
  next();
}
