import { Link } from "react-router";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { user, status, logout } = useAuth();
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
        <Link className="brand" to="/" onClick={closeMenu} aria-label="Travel Mint - Trang chủ">TRAVEL <span>MINT.</span></Link>
        <button className="menu-toggle" type="button" aria-expanded={menuOpen} aria-controls="main-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Đóng menu" : "Menu ☰"}</button>
        <nav id="main-menu" className={menuOpen ? "main-menu is-open" : "main-menu"} aria-label="Điều hướng chính">
          <Link to="/" onClick={closeMenu}>Trang chủ</Link>
          <Link to="/#tours" onClick={closeMenu}>Khám phá tour</Link>
          <Link to="/#about" onClick={closeMenu}>Giới thiệu</Link>
          {status === "loading" ? <span className="header-session-status">Đang kiểm tra…</span> : user ? <>
            {user.role === "admin" && <Link to="/admin" onClick={closeMenu}>Quản trị</Link>}
            <Link to="/account" onClick={closeMenu} className="account-nav-link">Tài khoản</Link>
            <Link to="/my-bookings" onClick={closeMenu}>Đơn của tôi</Link>
            <button className="header-logout" type="button" disabled={pending} onClick={handleLogout}>{pending ? "Đang thoát…" : "Đăng xuất"}</button>
          </> : <Link className="login-nav-link" to="/login" onClick={closeMenu}>Đăng nhập</Link>}
        </nav>
      </div>
      {error && <p className="header-error" role="alert">{error}</p>}
    </header>
  );
}
