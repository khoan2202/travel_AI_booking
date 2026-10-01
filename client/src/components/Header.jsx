import { Link } from "react-router";
import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="Travel Mint - Trang chủ">
          TRAVEL <span>MINT.</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "Đóng menu" : "Menu ☰"}
        </button>
        <nav id="main-menu" className={menuOpen ? "main-menu is-open" : "main-menu"} aria-label="Điều hướng chính">
          <Link to="/" onClick={closeMenu}>Trang chủ</Link>
          <Link to="/#tours" onClick={closeMenu}>Khám phá tour</Link>
          <Link to="/#about" onClick={closeMenu}>Giới thiệu</Link>
        </nav>
      </div>
    </header>
  );
}
