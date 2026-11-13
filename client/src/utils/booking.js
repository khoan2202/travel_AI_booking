// Các hàm nhỏ dùng cho trang đặt tour và trang đơn hàng.
// bookingCode(15) -> "TM000015": mã đơn hiển thị cho khách.
export const bookingCode = (id) => `TM${String(id).padStart(6, '0')}`;
// Đổi "2025-12-31" thành "31/12/2025".
export function bookingDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
// Đổi trạng thái tiếng Anh trong DB sang tiếng Việt để hiển thị.
export const bookingStatus = (value) => value === 'cancelled' ? 'Đã hủy' : 'Đã đặt chỗ';
export const paymentStatus = (value) => ({ unpaid: 'Chưa thanh toán', paid: 'Đã thanh toán', refunded: 'Đã hoàn tiền' }[value] || value);
// Tạo đường dẫn tới trang đặt tour, kèm tour, lịch đi và số khách.
export const checkoutPath = (tour, departure, guests) => `/booking?tour=${tour}&departure=${departure}&guests=${guests}`;

// Lưu tạm đơn đang gửi vào sessionStorage (mất khi đóng tab).
// Nếu mạng lỗi giữa chừng, bấm gửi lại sẽ dùng đúng request_key cũ nên không tạo đơn trùng.
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
