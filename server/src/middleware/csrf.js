import { timingSafeEqual } from "node:crypto";

export function requireCsrf(req, res, next) {
  const expected = req.session?.csrfToken;
  const actual = req.get("X-CSRF-Token");
  if (typeof expected !== "string" || typeof actual !== "string") {
    return res.status(403).json({ message: "Phiên biểu mẫu đã hết hạn. Vui lòng thử lại." });
  }
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(403).json({ message: "Phiên biểu mẫu đã hết hạn. Vui lòng thử lại." });
  }
  const origin = req.get("Origin");
  if (origin && !req.app.locals.allowedOrigins?.has(origin)) {
  return res.status(403).json({
    message: "Nguồn gửi yêu cầu không được chấp nhận."
  });
  }
  next();
}
