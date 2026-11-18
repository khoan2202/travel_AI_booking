// Các hàm nhỏ dùng chung cho blog và trang quản trị.

// Tên tiếng Việt của các chuyên mục.
export const BLOG_CATEGORIES = { guide: "Cẩm nang", destination: "Điểm đến", food: "Ẩm thực", tips: "Kinh nghiệm" };
export const POST_STATUSES = { draft: "Bản nháp", published: "Đã đăng", archived: "Đã ẩn" };

// Ảnh dự phòng khi bài viết chưa có ảnh bìa.
export const DEFAULT_COVER = "/images/coast.svg";

// Ước tính thời gian đọc: khoảng 1200 ký tự mỗi phút, tối thiểu 1 phút.
export const readingMinutes = (length) => Math.max(1, Math.round(Number(length || 0) / 1200));

// Hiển thị ngày theo giờ Việt Nam, ví dụ 18/11/2026.
export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

// Hiển thị ngày giờ, ví dụ 14:30 18/11/2026.
export function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

// Tạo slug từ tiêu đề: "Đà Lạt 3 ngày" -> "da-lat-3-ngay".
export function slugify(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 200);
}
