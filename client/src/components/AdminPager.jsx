// Nút chuyển trang dùng chung cho các bảng quản trị. Chỉ có 1 trang thì không hiện.
export default function AdminPager({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="booking-pagination" aria-label="Phân trang">
      <button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>Trang trước</button>
      <span>{page} / {totalPages}</span>
      <button className="button button-secondary" type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Trang sau</button>
    </nav>
  );
}
