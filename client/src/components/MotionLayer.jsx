// Các hiệu ứng chung của cả web, đặt một lần trong App.jsx: (1) khối nội dung hiện dần khi cuộn tới,
// (2) header thành nền kính mờ khi cuộn xuống, (3) nút "lên đầu trang" có vòng tiến độ cuộn,
// (4) vệt sáng chạy theo con trỏ trên thẻ tour. Bật "giảm chuyển động" thì tắt hiệu ứng (1).
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

// các khối sẽ hiện dần. Chỉ chọn phần tử có className cố định, vì React ghi đè className mỗi khi nó đổi và làm mất class hiệu ứng
const REVEAL_SELECTOR = [
  ".section-heading", ".tour-filters", ".tour-card:not(.skeleton-card)", ".about-art", ".about-content",
  ".travel-callout", ".detail-title", ".tour-facts > div", ".tour-overview", ".detail-help",
  ".departure-panel", ".suggestion-card", ".ai-filter", ".ai-chat", ".booking-list-card",
  ".booking-receipt", ".account-card", ".admin-metrics > article", ".contact-heading",
  ".contact-intro", ".contact-form", ".destination-tile", ".blog-card", ".blog-featured", ".admin-panel", ".home-blog-lead", ".home-blog-item",
].join(",");

// chu vi vòng tiến độ (bán kính 20)
const RING = 2 * Math.PI * 20;

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

export default function MotionLayer() {
  const { pathname } = useLocation();
  const ringRef = useRef(null);
  const [showTop, setShowTop] = useState(false);

  // (1) hiện dần khi cuộn. Dùng layout effect để chạy trước lúc vẽ, kẻo bị nháy: hiện, ẩn, rồi mới hiện dần
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
        // hiện xong thì gỡ class, kẻo hiệu ứng hover của chính phần tử đó bị trễ theo
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
        timers.add(setTimeout(finish, 2000)); // phòng khi transitionend không chạy
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });

    // tìm khối mới để gắn hiệu ứng, các khối cùng cha hiện lệch nhau một nhịp
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

    // nội dung hay tới sau khi API trả về, nên theo dõi DOM để quét lại
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

  // (2) và (3): theo dõi vị trí cuộn, gom lại mỗi khung hình một lần cho nhẹ
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

  // (4) ghi vị trí con trỏ vào biến CSS --mx, --my của thẻ đang trỏ vào
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
