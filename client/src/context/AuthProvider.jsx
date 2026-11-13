// Bọc toàn bộ app, giữ trạng thái đăng nhập và cung cấp các hàm login, logout, reload.
import { startTransition, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "./AuthContext.js";
import { getCurrentUser, loginUser, logoutUser } from "../services/authApi.js";

export default function AuthProvider({ children }) {
  const navigate = useNavigate();
  // status có 4 giá trị: "loading" (đang kiểm tra), "authenticated" (đã đăng nhập),
  // "guest" (chưa đăng nhập), "error" (không kết nối được server).
  const [auth, setAuth] = useState({ status: "loading", user: null, error: "" });
  const [reloadCount, setReloadCount] = useState(0);
  // Số phiên bản: tăng mỗi khi login/logout/tải lại. Kết quả trả về muộn của lần cũ
  // sẽ bị bỏ qua, tránh trạng thái bị ghi đè sai.
  const version = useRef(0);

  // Khi mở web (và mỗi lần gọi reload) thì hỏi server: người này đang đăng nhập không?
  useEffect(() => {
    const controller = new AbortController();
    const current = ++version.current;
    async function loadSession() {
      try {
        const user = await getCurrentUser(controller.signal);
        if (!controller.signal.aborted && current === version.current) {
          setAuth({ status: "authenticated", user, error: "" });
        }
      } catch (error) {
        if (!controller.signal.aborted && current === version.current) {
          // 401 nghĩa là chưa đăng nhập, không phải lỗi.
          setAuth(error.status === 401
            ? { status: "guest", user: null, error: "" }
            : { status: "error", user: null, error: error.message });
        }
      }
    }
    loadSession();
    // Rời trang trước khi request xong thì hủy request.
    return () => controller.abort();
  }, [reloadCount]);

  // Đăng nhập rồi cập nhật trạng thái ngay, không cần tải lại trang.
  async function login(email, password) {
    const current = ++version.current;
    const user = await loginUser(email, password);
    if (current === version.current) setAuth({ status: "authenticated", user, error: "" });
    return user;
  }

  // Đăng xuất rồi về trang chủ.
  async function logout() {
    const current = ++version.current;
    await logoutUser();
    if (current === version.current) {
      // Rời trang được bảo vệ cùng lúc xóa trạng thái, tránh chuyển nhầm về /login.
      startTransition(() => {
        navigate("/", { replace: true });
        setAuth({ status: "guest", user: null, error: "" });
      });
    }
  }

  // Kiểm tra lại phiên đăng nhập từ đầu (ví dụ nút "Thử lại" khi lỗi mạng).
  function reload() {
    setAuth({ status: "loading", user: null, error: "" });
    setReloadCount((count) => count + 1);
  }

  // Mọi component bên trong đều đọc được giá trị này qua useAuth().
  return <AuthContext.Provider value={{ ...auth, login, logout, reload }}>{children}</AuthContext.Provider>;
}
