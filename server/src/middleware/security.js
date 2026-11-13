// Thêm các header bảo mật vào mọi response.
// nosniff: trình duyệt không đoán kiểu file; DENY: trang không được nhúng vào iframe;
// Permissions-Policy: tắt camera, micro, định vị.
export function securityHeaders(req, res, next) {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' });
  // Chỉ áp dụng trên production:
  // HSTS: bắt trình duyệt luôn dùng HTTPS trong 1 năm.
  // CSP: chỉ cho tải script, style, font từ chính website; ảnh được lấy từ https.
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000');
    res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
  }
  next();
}
