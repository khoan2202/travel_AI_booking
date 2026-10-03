import { Link, Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, status, error, reload } = useAuth();
  const location = useLocation();
  if (status === "loading" || status === "error") {
    return <><Header /><main className="container detail-state"><h1>{status === "loading" ? "Đang kiểm tra đăng nhập…" : "Chưa kiểm tra được tài khoản"}</h1>{status === "error" && <><p role="alert">{error}</p><button type="button" className="button button-primary" onClick={reload}>Thử lại</button></>}</main><Footer /></>;
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (adminOnly && user.role !== "admin") {
    return <><Header /><main className="container detail-state"><p className="section-kicker">403 · KHÔNG CÓ QUYỀN</p><h1>Khu vực dành cho quản trị viên</h1><p>Tài khoản của bạn chưa có quyền truy cập khu vực này.</p><Link to="/account" className="button button-primary">Về tài khoản của tôi</Link></main><Footer /></>;
  }
  return children;
}
