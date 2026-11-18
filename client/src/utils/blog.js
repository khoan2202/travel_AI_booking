// Hàm nhỏ dùng chung cho blog và trang quản trị.

export const BLOG_CATEGORIES = { guide: "Cẩm nang", destination: "Điểm đến", food: "Ẩm thực", tips: "Kinh nghiệm" };
export const POST_STATUSES = { draft: "Bản nháp", published: "Đã đăng", archived: "Đã ẩn" };

// bài chưa có ảnh bìa thì dùng ảnh này
export const DEFAULT_COVER = "/images/coast.svg";

// ước chừng 1200 ký tự một phút, ít nhất 1 phút
export const readingMinutes = (length) => Math.max(1, Math.round(Number(length || 0) / 1200));

// theo giờ Việt Nam, vd 18/11/2026
export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

// vd 14:30 18/11/2026
export function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

// "Đà Lạt 3 ngày" thành "da-lat-3-ngay"
export function slugify(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 200);
}
