// Hàm gọi API dùng chung của cả frontend, kèm đăng nhập/đăng ký.
// Địa chỉ backend lấy từ VITE_API_BASE_URL. Không đặt thì: lúc chạy dev gọi localhost:5000,
// bản build gọi "/api" cùng domain (Vercel và Render đều phục vụ API ở đó).
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:5000/api" : "/api")
).replace(/\/+$/, "");

// request(): lo timeout, cookie, CSRF, đổi lỗi thành câu tiếng Việt. Trả về phần "data" của JSON.
export async function request(path, { method = "GET", body, token, signal } = {}) {
  // gộp hai cách hủy: component hủy (signal) và hết giờ
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  // 15 giây không trả lời thì bỏ
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
  try {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["X-CSRF-Token"] = token;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include", // để gửi và nhận cookie phiên
      cache: "no-store",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const result = await response.json();
    // server báo lỗi (4xx, 5xx): ném lỗi kèm thông báo, status và code
    if (!response.ok) {
      const error = new Error(result.message || "Yêu cầu chưa thực hiện được.");
      error.status = response.status;
      error.code = result.code;
      throw error;
    }
    return result.data;
  } catch (error) {
    // đổi lỗi kỹ thuật (hết giờ, mất mạng, trả về không phải JSON) thành câu dễ hiểu; cause giữ lỗi gốc cho lúc gỡ lỗi
    if (timedOut) throw new Error("Máy chủ phản hồi quá lâu. Vui lòng thử lại.", { cause: error });
    if (error instanceof TypeError) throw new Error("Chưa kết nối được máy chủ. Vui lòng thử lại.", { cause: error });
    if (error instanceof SyntaxError) throw new Error("Phản hồi của máy chủ chưa đúng định dạng.", { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

// POST có kèm CSRF token, dùng cho mọi thao tác ghi
export async function postAuth(path, body) {
  // lấy token mới trước mỗi lần ghi
  const { csrfToken } = await request("/auth/csrf");
  return request(path, { method: "POST", body, token: csrfToken });
}

export async function getCurrentUser(signal) {
  const result = await request("/auth/me", { signal });
  return result.user;
}

export async function registerUser(form) {
  return postAuth("/auth/register", form);
}

export async function loginUser(email, password) {
  const result = await postAuth("/auth/login", { email, password });
  return result.user;
}

export async function logoutUser() {
  return postAuth("/auth/logout");
}

export async function getAdminOverview(signal) {
  return request("/admin/overview", { signal });
}
