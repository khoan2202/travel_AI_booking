import "dotenv/config";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "../db/pool.js";

export const COOKIE_NAME = "travel.sid";
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
};

export function createSessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith("THAY_BANG_")) {
    throw new Error("Hãy thêm SESSION_SECRET ngẫu nhiên, ít nhất 32 ký tự, vào server/.env.");
  }

  const PgStore = connectPgSimple(session);
  const store = new PgStore({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: false,
    pruneSessionInterval: 900,
    errorLog: (error) => console.error("Lỗi lưu phiên:", error.code || error.name),
  });

  const middleware = session({
    name: COOKIE_NAME,
    secret,
    store,
    resave: false,
    saveUninitialized: false,
    cookie: { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 },
  });

  return { middleware, store };
}
