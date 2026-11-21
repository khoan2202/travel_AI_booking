// Bọc cả app, giữ trạng thái đăng nhập và cấp các hàm login, logout, reload.
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "./AuthContext.js";
import { getCurrentUser, loginUser, logoutUser } from "../services/authApi.js";

export default function AuthProvider({ children }) {
  const navigate = useNavigate();
  // status: "loading" (đang kiểm tra), "authenticated", "guest" (chưa đăng nhập), "error" (không nối được server)
  const [auth, setAuth] = useState({ status: "loading", user: null, error: "" });
  const [reloadCount, setReloadCount] = useState(0);
  // tăng mỗi lần login/logout/tải lại, để kết quả về muộn của lần cũ bị bỏ qua chứ không ghi đè trạng thái
  const version = useRef(0);

  // mở web (và mỗi lần reload) thì hỏi server xem đang đăng nhập không
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
          // 401 là chưa đăng nhập, không phải lỗi
          setAuth(error.status === 401
            ? { status: "guest", user: null, error: "" }
            : { status: "error", user: null, error: error.message });
        }
      }
    }
    loadSession();
    // rời trang giữa chừng thì hủy request
    return () => controller.abort();
  }, [reloadCount]);

  async function login(email, password) {
    const current = ++version.current;
    const user = await loginUser(email, password);
    if (current === version.current) setAuth({ status: "authenticated", user, error: "" });
    return user;
  }

  async function logout() {
    const current = ++version.current;
    await logoutUser();
    if (current === version.current) {
      // rời trang và xóa trạng thái cùng lúc, kẻo ProtectedRoute đá nhầm về /login
      startTransition(() => {
        navigate("/", { replace: true });
        setAuth({ status: "guest", user: null, error: "" });
      });
    }
  }

  // kiểm tra lại phiên từ đầu (vd nút "Thử lại" khi lỗi mạng).
  // useCallback giữ hàm không đổi giữa các lần vẽ, để các trang đưa nó vào deps mà không bị tải lại liên tục
  const reload = useCallback(() => {
    setAuth({ status: "loading", user: null, error: "" });
    setReloadCount((count) => count + 1);
  }, []);

  // component nào bên trong cũng đọc được qua useAuth()
  return <AuthContext.Provider value={{ ...auth, login, logout, reload }}>{children}</AuthContext.Provider>;
}
