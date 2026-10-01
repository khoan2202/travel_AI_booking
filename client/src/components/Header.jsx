import { useState } from "react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#top" onClick={closeMenu} aria-label="Travel Mint - Trang chủ">
          TRAVEL <span>MINT.</span>
        </a>
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
          <a href="#top" onClick={closeMenu}>Trang chủ</a>
          <a href="#tours" onClick={closeMenu}>Khám phá tour</a>
          <a href="#about" onClick={closeMenu}>Giới thiệu</a>
        </nav>
      </div>
    </header>
  );
}
