// Lớp hiệu ứng dùng chung cho toàn website (đặt một lần trong App.jsx):
// 1. Hiện dần các khối nội dung khi cuộn tới (scroll reveal).
// 2. Đổi kiểu header khi đã cuộn xuống (nền mờ kính).
// 3. Nút "lên đầu trang" có vòng tròn thể hiện tiến độ cuộn.
// 4. Vệt sáng chạy theo con trỏ trên thẻ tour.
// Người dùng bật "giảm chuyển động" trong hệ điều hành thì tắt hiệu ứng 1.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

// Các khối sẽ được hiện dần khi cuộn tới. Chỉ chọn phần tử có className cố định,
// vì React ghi đè className khi nó thay đổi, làm mất class hiệu ứng.
const REVEAL_SELECTOR = [
  ".section-heading", ".tour-filters", ".tour-card:not(.skeleton-card)", ".about-art", ".about-content",
  ".travel-callout", ".detail-title", ".tour-facts > div", ".tour-overview", ".detail-help",
  ".departure-panel", ".suggestion-card", ".ai-filter", ".ai-chat", ".booking-list-card",
  ".booking-receipt", ".account-card", ".admin-metrics > article", ".contact-heading",
  ".contact-intro", ".contact-form", ".destination-tile",
].join(",");

// Chu vi vòng tròn tiến độ (bán kính 20).
const RING = 2 * Math.PI * 20;

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function MotionLayer() {
  const { pathname } = useLocation();
  const ringRef = useRef(null);
  const [showTop, setShowTop] = useState(false);

  // Hiệu ứng 1: scroll reveal.
  // Chạy trước khi trình duyệt vẽ (layout effect) để không bị nháy: hiện -> ẩn -> hiện dần.
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    const seen = new WeakSet();
    const timers = new Set();

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        observer.unobserve(el);
        el.classList.add("is-visible");
        // Hiện xong thì gỡ class, để hiệu ứng hover của phần tử không bị trễ theo.
        const finish = () => {
          el.classList.remove("reveal", "is-visible");
          el.style.removeProperty("--reveal-delay");
        };
        const onEnd = (event) => {
          if (event.target !== el || event.propertyName !== "opacity") return;
          el.removeEventListener("transitionend", onEnd);
          finish();
        };
        el.addEventListener("transitionend", onEnd);
        timers.add(setTimeout(finish, 2000)); // Dự phòng nếu transitionend không chạy.
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

    // Tìm các khối mới xuất hiện và gắn hiệu ứng. Các khối cùng cha xuất hiện lệch nhau một chút.
    function scan() {
      let order = 0;
      let lastParent = null;
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (el.parentElement !== lastParent) { order = 0; lastParent = el.parentElement; }
        el.style.setProperty("--reveal-delay", `${Math.min(order++, 5) * 80}ms`);
        el.classList.add("reveal");
        observer.observe(el);
      });
    }

    // Nội dung trang thường đến sau (khi gọi API xong), nên theo dõi DOM để quét lại.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; scan(); });
    });
    scan();
    mutations.observe(document.getElementById("root"), { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
      cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
    };
  }, []);

  // Hiệu ứng 2 và 3: theo dõi vị trí cuộn (gom lại mỗi khung hình một lần cho nhẹ).
  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(y / max, 1) : 0;
      document.documentElement.classList.toggle("is-scrolled", y > 24);
      setShowTop(y > 640);
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(RING * (1 - progress));
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  // Hiệu ứng 4: lưu vị trí con trỏ vào biến CSS --mx, --my của thẻ đang được trỏ vào.
  useEffect(() => {
    function onMove(event) {
      const card = event.target.closest?.(".tour-card, .suggestion-card");
      if (!card) return;
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - box.left}px`);
      card.style.setProperty("--my", `${event.clientY - box.top}px`);
    }
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <button
      type="button"
      className={showTop ? "to-top is-shown" : "to-top"}
      onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
      aria-label="Lên đầu trang"
      aria-hidden={!showTop}
      tabIndex={showTop ? 0 : -1}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle className="to-top-track" cx="24" cy="24" r="20" />
        <circle className="to-top-ring" ref={ringRef} cx="24" cy="24" r="20" strokeDasharray={RING} strokeDashoffset={RING} />
      </svg>
      <span aria-hidden="true">↑</span>
    </button>
  );
}
