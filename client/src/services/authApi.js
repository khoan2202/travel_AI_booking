const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export async function request(path, { method = "GET", body, token, signal } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  else signal?.addEventListener("abort", cancel, { once: true });
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 15000);
  try {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers["X-CSRF-Token"] = token;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include", // Cho trình duyệt gửi/nhận cookie phiên.
      cache: "no-store",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok) {
      const error = new Error(result.message || "Yêu cầu chưa thực hiện được.");
      error.status = response.status;
      error.code = result.code;
      throw error;
    }
    return result.data;
  } catch (error) {
    if (timedOut) throw new Error("Máy chủ phản hồi quá lâu. Vui lòng thử lại.");
    if (error instanceof TypeError) throw new Error("Chưa kết nối được máy chủ. Vui lòng thử lại.");
    if (error instanceof SyntaxError) throw new Error("Phản hồi của máy chủ chưa đúng định dạng.");
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", cancel);
  }
}

export async function postAuth(path, body) {
  // Lấy token theo phiên hiện tại trước mỗi yêu cầu thay đổi trạng thái.
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
