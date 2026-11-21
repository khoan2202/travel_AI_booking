// Sau đăng nhập thì đưa khách về trang đang xem dở (?redirect=...), giữ cả query để quay lại đúng lịch tour.
// Chỉ nhận các trang nội bộ trong danh sách, không để ai dụ khách sang web lạ.
export function safeAuthRedirect(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/account';
  try {
    const url = new URL(value, 'http://travel.internal');
    const allowed = ['/account', '/recommendations', '/admin', '/admin/tours', '/admin/bookings', '/booking', '/my-bookings'].includes(url.pathname)
      || /^\/admin\/bookings\/[1-9]\d*$/.test(url.pathname)
      || /^\/my-bookings\/[1-9]\d*$/.test(url.pathname);
    return url.origin === 'http://travel.internal' && allowed ? url.pathname + url.search : '/account';
  } catch { return '/account'; }
}
