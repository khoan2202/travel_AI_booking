// Session đăng nhập. Dữ liệu phiên nằm trong bảng user_sessions, trình duyệt chỉ giữ cookie chứa mã phiên.
import "dotenv/config";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "../db/pool.js";

export const COOKIE_NAME = "travel.sid";
// httpOnly để JS trên trang không đọc được cookie, secure để production chỉ gửi qua HTTPS
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

// trả cả store ra để server.js đóng lại khi tắt
export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  // khóa ngắn hoặc còn là giá trị mẫu thì không cho chạy
  if (!secret || secret.length < 32 || secret.startsWith("THAY_BANG_")) {
    throw new Error("Hãy thêm SESSION_SECRET ngẫu nhiên, ít nhất 32 ký tự, vào server/.env.");
  }

  const PgStore = connectPgSimple(session);
  const store = new PgStore({
    pool,
    tableName: "user_sessions",
    // bảng đã có sẵn từ file SQL, không tự tạo
    createTableIfMissing: false,
    // 15 phút dọn phiên hết hạn một lần
    pruneSessionInterval: 900,
    errorLog: (error) => console.error("Lỗi lưu phiên:", error.code || error.name),
  });

  const middleware = session({
    name: COOKIE_NAME,
    secret,
    store,
    // chỉ lưu phiên khi có thay đổi, không tạo phiên rỗng
    resave: false,
    saveUninitialized: false,
    // sống 8 tiếng
    cookie: { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 },
  });

  return { middleware, store };
}
