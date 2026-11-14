// Chống tấn công CSRF (trang web lạ lợi dụng cookie để gửi request thay người dùng).
// Khi đăng nhập, server cấp một token lưu trong session. Frontend phải gửi lại token đó
// trong header X-CSRF-Token với mọi request ghi dữ liệu (POST, PATCH, DELETE).
import { timingSafeEqual } from "node:crypto";

export function requireCsrf(req, res, next) {
  // Token server đã lưu và token frontend gửi lên.
  const expected = req.session?.csrfToken;
  const actual = req.get("X-CSRF-Token");
  if (typeof expected !== "string" || typeof actual !== "string") {
    return res.status(403).json({ message: "Phiên biểu mẫu đã hết hạn. Vui lòng thử lại." });
  }
  // So sánh bằng timingSafeEqual để kẻ tấn công không đoán được token qua thời gian phản hồi.
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(403).json({ message: "Phiên biểu mẫu đã hết hạn. Vui lòng thử lại." });
  }
  // Kiểm tra thêm request phải đến từ origin được phép.
  const origin = req.get("Origin");
  // Dùng chung quy tắc với CORS (xem isAllowedOrigin trong app.js).
  if (origin && !req.app.locals.isAllowedOrigin?.(origin, req)) {
  return res.status(403).json({
    message: "Nguồn gửi yêu cầu không được chấp nhận."
  });
  }
  next();
}
