import { startTransition, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "./AuthContext.js";
import { getCurrentUser, loginUser, logoutUser } from "../services/authApi.js";

export default function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [auth, setAuth] = useState({ status: "loading", user: null, error: "" });
  const [reloadCount, setReloadCount] = useState(0);
  const version = useRef(0);

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
          setAuth(error.status === 401
            ? { status: "guest", user: null, error: "" }
            : { status: "error", user: null, error: error.message });
        }
      }
    }
    loadSession();
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
      // Rời trang được bảo vệ cùng lúc xóa trạng thái, tránh chuyển nhầm về /login.
      startTransition(() => {
        navigate("/", { replace: true });
        setAuth({ status: "guest", user: null, error: "" });
      });
    }
  }

  function reload() {
    setAuth({ status: "loading", user: null, error: "" });
    setReloadCount((count) => count + 1);
  }

  return <AuthContext.Provider value={{ ...auth, login, logout, reload }}>{children}</AuthContext.Provider>;
}
