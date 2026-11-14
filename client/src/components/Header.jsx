// Thanh điều hướng trên cùng, dùng chung cho mọi trang.
// Menu thay đổi theo trạng thái: chưa đăng nhập, đã đăng nhập, là admin.
// NavLink tự thêm class "active" cho mục ứng với trang đang mở (để gạch chân và tô màu).
import { Link, NavLink } from "react-router";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export default function Header() {
  // menuOpen: menu đang mở trên điện thoại hay không.
  const [menuOpen, setMenuOpen] = useState(false);
  // pending: đang đăng xuất (khóa nút để không bấm hai lần).
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { user, status, logout } = useAuth();
  // Đóng menu sau khi bấm một link (trên điện thoại).
  const closeMenu = () => setMenuOpen(false);

  async function handleLogout() {
    setPending(true);
    setError("");
    try {
      await logout();
      closeMenu();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link
          className="brand"
          to="/"
          onClick={closeMenu}
          aria-label="Travel Mint - Trang chủ"
        >
          TRAVEL <span>MINT.</span>
        </Link>
        {/* Nút mở/đóng menu, chỉ hiện trên màn hình nhỏ (xem CSS) */}
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Đóng menu" : "Menu ☰"}
        </button>
        <nav
          id="main-menu"
          className={menuOpen ? "main-menu is-open" : "main-menu"}
          aria-label="Điều hướng chính"
        >
          <NavLink to="/" end onClick={closeMenu}>
            Trang chủ
          </NavLink>
          <Link to="/#tours" onClick={closeMenu}>
            Khám phá tour
          </Link>
          <NavLink to="/recommendations" onClick={closeMenu}>
            Tư vấn AI
          </NavLink>
          <NavLink to="/contact" onClick={closeMenu}>
            Liên hệ &amp; Hỗ trợ
          </NavLink>
          {/* Đang kiểm tra phiên: hiện chữ chờ. Đã đăng nhập: hiện menu tài khoản. Chưa đăng nhập: hiện nút Đăng nhập */}
          {status === "loading" ? (
            <span className="header-session-status">Đang kiểm tra…</span>
          ) : user ? (
            <>
              {/* Mục Quản trị chỉ hiện với admin */}
              {user.role === "admin" && (
                <NavLink to="/admin" onClick={closeMenu}>
                  Quản trị
                </NavLink>
              )}
              <NavLink
                to="/account"
                onClick={closeMenu}
                className="account-nav-link"
              >
                Tài khoản
              </NavLink>
              <NavLink to="/my-bookings" onClick={closeMenu}>
                Đơn của tôi
              </NavLink>
              <button
                className="header-logout"
                type="button"
                disabled={pending}
                onClick={handleLogout}
              >
                {pending ? "Đang thoát…" : "Đăng xuất"}
              </button>
            </>
          ) : (
            <Link className="login-nav-link" to="/login" onClick={closeMenu}>
              Đăng nhập
            </Link>
          )}
        </nav>
      </div>
      {error && (
        <p className="header-error" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}
