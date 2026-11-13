// Mỗi lần đổi trang: có #id trên URL (ví dụ /#tours) thì cuộn tới mục đó, không thì cuộn lên đầu trang.
// Component này không hiển thị gì (return null).
import { useEffect } from "react";
import { useLocation } from "react-router";

export default function ScrollToSection() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // Chờ trình duyệt vẽ xong trang mới (requestAnimationFrame) rồi mới cuộn.
    const frame = requestAnimationFrame(() => {
      const section = hash ? document.getElementById(hash.slice(1)) : null;
      if (section) {
        section.scrollIntoView({ behavior: "instant", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, key]);

  return null;
}
