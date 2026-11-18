// Nút chuyển giao diện sáng/tối trên header.
// Lựa chọn được lưu lại cho lần sau; khách chưa chọn thì website theo cài đặt của máy.
// Khi đổi, giao diện mới lan ra thành vòng tròn từ vị trí nút bấm.
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

const STORAGE_KEY = "travel.theme";
const HEADER_COLORS = { light: "#232323", dark: "#0b110f" };

// Đọc lựa chọn đã lưu; trình duyệt chặn lưu trữ thì coi như chưa chọn.
function readSaved() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

// Áp dụng giao diện lên toàn trang và đổi màu thanh trình duyệt trên điện thoại.
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", HEADER_COLORS[theme]);
}

export default function ThemeToggle() {
  // theme-init.js đã chọn giao diện từ trước nên chỉ cần đọc lại.
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"));
  const buttonRef = useRef(null);
  const next = theme === "dark" ? "light" : "dark";

  // Khách chưa tự chọn: máy đổi sáng/tối thì website đổi theo.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => {
      if (readSaved()) return;
      const value = event.matches ? "dark" : "light";
      applyTheme(value);
      setTheme(value);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  function toggle() {
    const change = () => {
      applyTheme(next);
      setTheme(next);
    };
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Không lưu được thì vẫn đổi trong lần xem này. */ }

    // Trình duyệt cũ hoặc khách bật "giảm chuyển động": đổi ngay, không có hiệu ứng.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) { change(); return; }

    // Tính vòng tròn đủ lớn để phủ kín màn hình, tâm là nút vừa bấm.
    const box = buttonRef.current.getBoundingClientRect();
    const x = box.left + box.width / 2, y = box.top + box.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(() => flushSync(change));
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: "cubic-bezier(.22, 1, .36, 1)", pseudoElement: "::view-transition-new(root)" },
      );
    }).catch(() => { /* Hiệu ứng bị bỏ qua thì giao diện vẫn đã đổi xong. */ });
  }

  const label = next === "dark" ? "Chuyển sang giao diện tối" : "Chuyển sang giao diện sáng";
  return (
    <button ref={buttonRef} className="theme-toggle" type="button" onClick={toggle} aria-label={label} title={label}>
      {/* Hai biểu tượng xếp chồng, xoay và mờ dần khi đổi giao diện */}
      <svg className="theme-icon is-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" />
      </svg>
      <svg className="theme-icon is-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4a8.2 8.2 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
