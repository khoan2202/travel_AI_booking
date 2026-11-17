// Giữ danh sách tour đang chọn để so sánh và lưu vào localStorage,
// nên tải lại trang hoặc chuyển trang vẫn còn.
// Mỗi mục chỉ lưu vài thông tin để hiện trên khay so sánh: id, tên, điểm đến, ảnh.
// Dữ liệu đầy đủ (giá, lịch đi...) luôn được tải mới ở trang /compare.
import { useEffect, useState } from "react";
import { CompareContext, COMPARE_LIMIT } from "./CompareContext.js";

const STORAGE_KEY = "travel.compare";

// Đọc danh sách đã lưu, bỏ qua dữ liệu hỏng hoặc trình duyệt chặn lưu trữ.
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

// Chỉ giữ các trường cần cho khay so sánh.
const pick = (tour) => ({
  id: tour.id,
  title: tour.title,
  destination: tour.destination,
  image_url: tour.image_url || null,
});

export default function CompareProvider({ children }) {
  const [items, setItems] = useState(loadSaved);

  // Mỗi lần danh sách đổi thì lưu lại.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Không lưu được thì vẫn dùng bình thường trong phiên này. */ }
  }, [items]);

  const has = (id) => items.some((item) => item.id === id);
  const full = items.length >= COMPARE_LIMIT;

  // Bấm một lần để thêm, bấm lần nữa để bỏ. Đã đủ 3 tour thì không thêm nữa.
  function toggle(tour) {
    setItems((current) => {
      if (current.some((item) => item.id === tour.id)) return current.filter((item) => item.id !== tour.id);
      if (current.length >= COMPARE_LIMIT) return current;
      return [...current, pick(tour)];
    });
  }
  const remove = (id) => setItems((current) => current.filter((item) => item.id !== id));
  const clear = () => setItems([]);
  // Thay cả danh sách (ví dụ: so sánh 3 tour từ kết quả quiz).
  const replace = (tours) => setItems(tours.slice(0, COMPARE_LIMIT).map(pick));

  return (
    <CompareContext.Provider value={{ items, has, full, toggle, remove, clear, replace }}>
      {children}
    </CompareContext.Provider>
  );
}
