// Chỉ nhận đường dẫn nội bộ đã biết, giữ query để quay lại lịch tour sau đăng nhập.
// Sau khi đăng nhập, chuyển người dùng về trang họ đang xem dở (?redirect=...).
// Chỉ chấp nhận các trang trong danh sách, chặn việc bị chuyển sang website lạ.
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
