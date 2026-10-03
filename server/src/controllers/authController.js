import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import pool from "../db/pool.js";
import { COOKIE_NAME, cookieOptions } from "../config/session.js";

const dummyHash = bcrypt.hash(randomBytes(32).toString("base64"), 12);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (typeof body.email !== "string" || typeof body.password !== "string") return null;
  const email = body.email.trim().toLowerCase();
  if (email.length > 254 || !emailPattern.test(email)) return null;
  if (!body.password || Buffer.byteLength(body.password, "utf8") > 72) return null;
  return { email, password: body.password };
}

export async function getCsrfToken(req, res, next) {
  try {
    if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString("hex");
    await new Promise((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));
    res.json({ data: { csrfToken: req.session.csrfToken } });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
  const credentials = readCredentials(req.body);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!credentials || name.length < 2 || name.length > 100 || credentials.password.length < 10) {
    return res.status(400).json({ message: "Kiểm tra họ tên, email và mật khẩu (ít nhất 10 ký tự; tránh mật khẩu quá dài)." });
  }
  try {
    const passwordHash = await bcrypt.hash(credentials.password, 12);
    const result = await pool.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'user')
      RETURNING id, name, email, role
    `, [name, credentials.email, passwordHash]);
    res.status(201).json({
      message: "Đăng ký thành công. Bạn có thể đăng nhập.",
      data: { user: result.rows[0] },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email này đã được sử dụng." });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  const credentials = readCredentials(req.body);
  if (!credentials) {
    return res.status(400).json({ message: "Email hoặc mật khẩu chưa hợp lệ." });
  }
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, password_hash FROM users WHERE email = $1",
      [credentials.email]
    );
    const row = result.rows[0];
    const matches = await bcrypt.compare(credentials.password, row?.password_hash || await dummyHash);
    if (!row || !matches) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
    }

    // Tạo session ID mới sau đăng nhập để ngăn session fixation.
    await new Promise((resolve, reject) => req.session.regenerate((err) => err ? reject(err) : resolve()));
    req.session.userId = row.id;
    req.session.csrfToken = randomBytes(32).toString("hex");
    await new Promise((resolve, reject) => req.session.save((err) => err ? reject(err) : resolve()));

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    res.json({ message: "Đăng nhập thành công", data: { user } });
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({ data: { user: req.user } });
}

export async function logout(req, res, next) {
  try {
    await new Promise((resolve, reject) => req.session.destroy((err) => err ? reject(err) : resolve()));
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ message: "Đã đăng xuất", data: null });
  } catch (error) {
    next(error);
  }
}
