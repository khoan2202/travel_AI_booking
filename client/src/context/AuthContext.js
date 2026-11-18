// Kho chung thông tin đăng nhập cho cả app (React Context).
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

// const { user, status, login, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải nằm trong AuthProvider.");
  return context;
}
