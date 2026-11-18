// Header bảo mật cho mọi response: không cho trình duyệt đoán kiểu file, không cho nhúng iframe,
// tắt camera, micro, định vị.
export function securityHeaders(req, res, next) {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' });
  // riêng production: HSTS (ép HTTPS 1 năm) và CSP (script, font chỉ từ chính web, ảnh cho phép https)
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000');
    res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'");
  }
  next();
}
