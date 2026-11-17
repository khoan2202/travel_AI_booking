// Khay so sánh nổi ở cuối màn hình, hiện khi khách đã chọn ít nhất 1 tour.
// Có 3 ô (tour đã chọn hoặc ô trống), nút "So sánh ngay" (cần ít nhất 2 tour) và nút xóa hết.
// Ẩn khi đang ở chính trang /compare.
import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useCompare, COMPARE_LIMIT } from "../context/CompareContext.js";
import { imagesFor } from "../data/destinationImages.js";

export default function CompareTray() {
  const { items, remove, clear } = useCompare();
  const { pathname } = useLocation();
  const visible = items.length > 0 && pathname !== "/compare";

  // Báo cho CSS biết khay đang hiện, để nút "lên đầu trang" nhích lên, không bị che.
  useEffect(() => {
    document.documentElement.classList.toggle("has-compare-tray", visible);
    return () => document.documentElement.classList.remove("has-compare-tray");
  }, [visible]);

  if (!visible) return null;
  const slots = Array.from({ length: COMPARE_LIMIT }, (_, i) => items[i] || null);
  const ready = items.length >= 2;

  return (
    <aside className="compare-tray" aria-label="Tour đang chọn để so sánh">
      <div className="compare-tray-inner">
        <p className="compare-tray-title"><strong>So sánh tour</strong><span>{items.length}/{COMPARE_LIMIT} đã chọn</span></p>
        <ul className="compare-slots">
          {slots.map((item, i) => item ? (
            <li key={item.id} className="compare-slot">
              <img src={item.image_url || imagesFor(item.destination).cover.src} alt="" width="56" height="42" />
              <span>{item.title}</span>
              <button type="button" onClick={() => remove(item.id)} aria-label={`Bỏ ${item.title}`}>×</button>
            </li>
          ) : (
            <li key={`empty-${i}`} className="compare-slot is-empty">Chọn thêm tour</li>
          ))}
        </ul>
        <div className="compare-tray-actions">
          {ready
            ? <Link className="button button-primary" to={`/compare?ids=${items.map((item) => item.id).join(",")}`}>So sánh ngay <span aria-hidden="true">→</span></Link>
            : <span className="compare-tray-hint">Chọn ít nhất 2 tour</span>}
          <button type="button" className="compare-clear" onClick={clear}>Xóa hết</button>
        </div>
      </div>
    </aside>
  );
}
