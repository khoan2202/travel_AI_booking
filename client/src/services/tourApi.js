// Đây là địa chỉ công khai của backend, không phải nơi lưu API key AI.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

async function apiGet(path, signal) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    const result = await response.json();

    if (!response.ok) {
      const error = new Error(result.message || "Máy chủ chưa xử lý được yêu cầu.");
      error.status = response.status;
      throw error;
    }

    return result.data;
  } catch (error) {
    if (timedOut) throw new Error("Máy chủ phản hồi quá lâu. Vui lòng thử lại.", { cause: error });
    if (error instanceof TypeError) {
      throw new Error("Chưa kết nối được máy chủ. Vui lòng thử lại.", { cause: error });
    }
    if (error instanceof SyntaxError) {
      throw new Error("Phản hồi của máy chủ chưa đúng định dạng JSON.", { cause: error });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

export async function getTours(signal) {
  const data = await apiGet("/tours", signal);
  if (!Array.isArray(data)) throw new Error("Danh sách tour chưa đúng định dạng.");
  return data;
}

export async function getTourById(id, signal) {
  const data = await apiGet(`/tours/${encodeURIComponent(id)}`, signal);
  if (!data || !Number.isInteger(data.id)) throw new Error("Thông tin tour chưa đúng định dạng.");
  return data;
}

export async function getTourDepartures(id, signal) {
  const data = await apiGet(`/tours/${encodeURIComponent(id)}/departures`, signal);
  if (!Array.isArray(data)) throw new Error("Lịch khởi hành chưa đúng định dạng.");
  return data;
}
