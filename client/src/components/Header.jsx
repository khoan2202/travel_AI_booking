// Thanh menu trên cùng. Menu đổi theo việc đã đăng nhập chưa, và có phải admin không.
// NavLink tự gắn class "active" cho mục đang mở (để gạch chân, tô màu).
import { Link, NavLink } from "react-router";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Header() {
  // menu trên điện thoại đang mở hay đóng
  const [menuOpen, setMenuOpen] = useState(false);
  // đang đăng xuất, khóa nút cho khỏi bấm hai lần
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { user, status, logout } = useAuth();
  // bấm link xong thì đóng menu (điện thoại)
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
        {/* chỉ hiện trên màn hình nhỏ, xem CSS */}
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
          <NavLink to="/blog" onClick={closeMenu}>
            Blog
          </NavLink>
          <NavLink to="/contact" onClick={closeMenu}>
            Liên hệ &amp; Hỗ trợ
          </NavLink>
          {/* ba trường hợp: đang kiểm tra phiên, đã đăng nhập, chưa đăng nhập */}
          {status === "loading" ? (
            <span className="header-session-status">Đang kiểm tra…</span>
          ) : user ? (
            <>
              {/* chỉ admin mới thấy mục này */}
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
        {/* để ngoài menu cho điện thoại khỏi phải mở menu mới bấm được */}
        <ThemeToggle />
      </div>
      {error && (
        <p className="header-error" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}
