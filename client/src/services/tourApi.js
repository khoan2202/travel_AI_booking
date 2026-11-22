// API tour công khai. Địa chỉ backend ở đây là công khai, tuyệt đối không để khóa AI trong frontend.
// Dùng chung request() (timeout 15 giây, lỗi đổi thành câu tiếng Việt) với các API khác.
import { request } from "./authApi.js";

// mỗi hàm kiểm tra dữ liệu có đúng dạng rồi mới đưa cho giao diện
export async function getTours(signal) {
  const data = await request("/tours", { signal });
  if (!Array.isArray(data)) throw new Error("Danh sách tour chưa đúng định dạng.");
  return data;
}

export async function getTourById(id, signal) {
  const data = await request(`/tours/${encodeURIComponent(id)}`, { signal });
  if (!data || !Number.isInteger(data.id)) throw new Error("Thông tin tour chưa đúng định dạng.");
  return data;
}

export async function getTourDepartures(id, signal) {
  const data = await request(`/tours/${encodeURIComponent(id)}/departures`, { signal });
  if (!Array.isArray(data)) throw new Error("Lịch khởi hành chưa đúng định dạng.");
  return data;
}
