// URL này là cấu hình công khai. Không đặt API key AI ở frontend.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export async function getTours(signal) {
  const response = await fetch(`${API_BASE_URL}/tours`, { signal });

  if (!response.ok) {
    throw new Error("Không tải được danh sách tour. Vui lòng thử lại.");
  }

  const result = await response.json();

  if (!Array.isArray(result.data)) {
    throw new Error("Dữ liệu tour chưa đúng định dạng.");
  }

  return result.data;
}
