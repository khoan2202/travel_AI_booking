// Nút "So sánh" trên thẻ tour và trang chi tiết: bấm để thêm/bỏ tour khỏi danh sách so sánh.
// Đã chọn đủ 3 tour thì các tour khác bị khóa nút, kèm gợi ý.
import { useCompare, COMPARE_LIMIT } from "../context/CompareContext.js";

export default function CompareToggle({ tour, className = "" }) {
  const { has, full, toggle } = useCompare();
  const selected = has(tour.id);
  const locked = full && !selected;

  return (
    <button
      type="button"
      className={`compare-toggle ${selected ? "is-selected" : ""} ${className}`}
      onClick={() => toggle(tour)}
      disabled={locked}
      aria-pressed={selected}
      title={locked ? `Đã chọn đủ ${COMPARE_LIMIT} tour để so sánh` : undefined}
      aria-label={selected ? `Bỏ ${tour.title} khỏi so sánh` : `Thêm ${tour.title} vào so sánh`}
    >
      <span className="compare-box" aria-hidden="true">{selected ? "✓" : "+"}</span>
      {selected ? "Đang so sánh" : "So sánh"}
    </button>
  );
}
