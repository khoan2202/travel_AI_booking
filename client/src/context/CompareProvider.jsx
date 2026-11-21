// Giữ các tour đang chọn để so sánh và lưu vào localStorage, tải lại hay sang trang khác vẫn còn.
// Mỗi mục chỉ lưu id, tên, điểm đến, ảnh cho khay; giá và lịch luôn tải mới ở /compare.
import { useEffect, useState } from "react";
import { CompareContext, COMPARE_LIMIT } from "./CompareContext.js";

const STORAGE_KEY = "travel.compare";

// dữ liệu hỏng hoặc trình duyệt chặn lưu trữ thì coi như trống
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved)
      ? saved.filter((item) => Number.isInteger(item?.id)).slice(0, COMPARE_LIMIT)
      : [];
  } catch {
    return [];
  }
}

// chỉ giữ trường khay cần
const pick = (tour) => ({
  id: tour.id,
  title: tour.title,
  destination: tour.destination,
  image_url: tour.image_url || null,
});

export default function CompareProvider({ children }) {
  const [items, setItems] = useState(loadSaved);

  // danh sách đổi là lưu lại
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Không lưu được thì vẫn dùng bình thường trong phiên này. */ }
  }, [items]);

  const has = (id) => items.some((item) => item.id === id);
  const full = items.length >= COMPARE_LIMIT;

  // bấm lần đầu thêm, bấm lần nữa bỏ; đủ 3 tour thì không thêm nữa
  function toggle(tour) {
    setItems((current) => {
      if (current.some((item) => item.id === tour.id)) return current.filter((item) => item.id !== tour.id);
      if (current.length >= COMPARE_LIMIT) return current;
      return [...current, pick(tour)];
    });
  }
  const remove = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const clear = () => setItems([]);
  // thay cả danh sách (vd so sánh 3 tour từ kết quả quiz)
  const replace = (tours) => setItems(tours.slice(0, COMPARE_LIMIT).map(pick));

  return (
    <CompareContext.Provider value={{ items, has, full, toggle, remove, clear, replace }}>
      {children}
    </CompareContext.Provider>
  );
}
