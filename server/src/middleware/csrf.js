// Chống CSRF: trang lạ không được mượn cookie của khách để gửi request thay họ.
// Token nằm trong session, mọi request ghi dữ liệu phải gửi lại nó qua header X-CSRF-Token.
import { timingSafeEqual } from "node:crypto";

export function requireCsrf(req, res, next) {
  const expected = req.session?.csrfToken;
  const actual = req.get("X-CSRF-Token");
  if (typeof expected !== "string" || typeof actual !== "string") {
    return res.status(403).json({ message: "Phiên biểu mẫu đã hết hạn. Vui lòng thử lại." });
  }
  // timingSafeEqual để không đoán được token qua thời gian phản hồi
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(403).json({ message: "Phiên biểu mẫu đã hết hạn. Vui lòng thử lại." });
  }
  // có Origin thì phải là origin được phép, cùng luật với CORS (isAllowedOrigin trong app.js)
  const origin = req.get("Origin");
  if (origin && !req.app.locals.isAllowedOrigin?.(origin)) {
  return res.status(403).json({
    message: "Nguồn gửi yêu cầu không được chấp nhận."
  });
  }
  next();
}
