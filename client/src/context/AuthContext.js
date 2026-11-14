// "Kho" dùng chung thông tin đăng nhập cho cả ứng dụng (React Context).
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

// Hook để component lấy thông tin đăng nhập: const { user, status, login, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider.");
  return context;
}
