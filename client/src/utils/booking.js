// Hàm nhỏ cho trang đặt tour và trang đơn. bookingCode(15) ra "TM000015", là mã đơn khách nhìn thấy.
export const bookingCode = (id) => `TM${String(id).padStart(6, '0')}`;
// "2025-12-31" thành "31/12/2025"
export function bookingDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
// trạng thái trong DB (tiếng Anh) sang tiếng Việt
export const bookingStatus = (value) => value === 'cancelled' ? 'Đã hủy' : 'Đã đặt chỗ';
export const paymentStatus = (value) => ({ unpaid: 'Chưa thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền' }[value] || value);
// link sang trang đặt, kèm tour, lịch và số khách
export const checkoutPath = (tour, departure, guests) => `/booking?tour=${tour}&departure=${departure}&guests=${guests}`;

// đơn đang gửi được giữ tạm trong sessionStorage (đóng tab là mất).
// rớt mạng giữa chừng thì gửi lại bằng đúng request_key cũ, nên không ra đơn thứ hai
const storageKey = (userId) => `travel.pending-booking:${userId}`;
export function readPending(userId) {
  try {
    const item = JSON.parse(sessionStorage.getItem(storageKey(userId)));
    return item && Number.isInteger(item.tourId) && item.body?.request_key ? item : null;
  } catch { return null; }
}
export function savePending(userId, item) {
  // giữ nguyên mã và nội dung khi thử lại, F5 trong cùng tab cũng vẫn còn
  sessionStorage.setItem(storageKey(userId), JSON.stringify(item));
}
export function clearPending(userId) {
  try { sessionStorage.removeItem(storageKey(userId)); } catch { /* Gửi lại mã cũ vẫn không tạo đơn trùng. */ }
}
