// Cấu hình phiên đăng nhập (session). Phiên được lưu trong bảng user_sessions
// của PostgreSQL; trình duyệt chỉ giữ cookie chứa mã phiên.
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "../db/pool.js";

// Tên cookie phiên trên trình duyệt.
export const COOKIE_NAME = "travel.sid";
// httpOnly: JavaScript trên trang không đọc được cookie (chống đánh cắp qua XSS).
// secure: production chỉ gửi cookie qua HTTPS.
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

// Tạo middleware session. Trả về cả store để server.js đóng lại khi tắt.
export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  // Khóa ký cookie phải đủ dài và không phải giá trị mẫu, nếu không thì dừng server.
  if (!secret || secret.length < 32 || secret.startsWith("THAY_BANG_")) {
    throw new Error("Hãy thêm SESSION_SECRET ngẫu nhiên, ít nhất 32 ký tự, vào server/.env.");
  }

  // Dùng PostgreSQL làm nơi lưu phiên (thư viện connect-pg-simple).
  const PgStore = connectPgSimple(session);
  const store = new PgStore({
    pool,
    tableName: "user_sessions",
    // Không tự tạo bảng; bảng phải có sẵn từ file SQL.
    createTableIfMissing: false,
    // Cứ 900 giây (15 phút) xóa các phiên đã hết hạn.
    // Workers không giữ timer nền giữa các request; để cron/dọn dẹp riêng khi cần.
    pruneSessionInterval: process.env.CLOUDFLARE_WORKER === "true" ? false : 900,
    errorLog: (error) => console.error("Lỗi lưu phiên:", error.code || error.name),
  });

  const middleware = session({
    name: COOKIE_NAME,
    secret,
    store,
    // resave/saveUninitialized = false: chỉ lưu phiên khi có thay đổi, không tạo phiên rỗng.
    resave: false,
    saveUninitialized: false,
    // Phiên sống 8 tiếng.
    cookie: { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 },
  });

  return { middleware, store };
}
