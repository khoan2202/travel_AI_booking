export const bookingCode = (id) => `TM${String(id).padStart(6, '0')}`;
export function bookingDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
export const bookingStatus = (value) => value === 'cancelled' ? 'Đã hủy' : 'Đã đặt chỗ';
export const paymentStatus = (value) => ({ unpaid: 'Chưa thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền' }[value] || value);
export const checkoutPath = (tour, departure, guests) => `/booking?tour=${tour}&departure=${departure}&guests=${guests}`;

const storageKey = (userId) => `travel.pending-booking:${userId}`;
export function readPending(userId) {
  try {
    const item = JSON.parse(sessionStorage.getItem(storageKey(userId)));
    return item && Number.isInteger(item.tourId) && item.body?.request_key ? item : null;
  } catch { return null; }
}
export function savePending(userId, item) {
  // Giữ nguyên mã và nội dung khi retry, kể cả sau F5 trong cùng tab.
  sessionStorage.setItem(storageKey(userId), JSON.stringify(item));
}
export function clearPending(userId) {
  try { sessionStorage.removeItem(storageKey(userId)); } catch { /* Gửi lại mã cũ vẫn không tạo đơn trùng. */ }
}
