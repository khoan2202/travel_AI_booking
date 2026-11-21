// Đổi trang thì cuộn: URL có #id (vd /#tours) thì tới mục đó, không thì lên đầu trang. Không vẽ gì cả.
import { useEffect } from "react";
import { useLocation } from "react-router";

export default function ScrollToSection() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // đợi trình duyệt vẽ xong trang mới rồi hãy cuộn
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
