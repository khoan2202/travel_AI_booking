export function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return "Liên hệ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

// Cho phép tìm "da lat" và "Đà Lạt" cho cùng một kết quả.
export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
