// Nhật ký thao tác (/admin/activity): ai đã làm gì, với đối tượng nào, lúc nào.
import { useCallback, useState } from "react";
import { Link } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import AdminNav from "../components/AdminNav.jsx";
import AdminPager from "../components/AdminPager.jsx";
import useLoad from "../hooks/useLoad.js";
import { getAdminActivity } from "../services/adminApi.js";
import { bookingCode } from "../utils/booking.js";
import { formatDateTime } from "../utils/blog.js";

// Đổi mã thao tác thành câu tiếng Việt dễ đọc.
const ACTIONS = {
  "booking.mark_paid": "ghi nhận thanh toán đơn", "booking.cancel_unpaid": "hủy đơn chưa thanh toán", "booking.refund_cancel": "hoàn tiền và hủy đơn",
  "tour.create": "tạo tour", "tour.update": "sửa tour", "tour.status": "đổi trạng thái tour", "tour.duplicate": "nhân bản tour",
  "departure.create": "thêm lịch khởi hành", "departure.update": "sửa lịch khởi hành", "departure.bulk": "tạo nhiều lịch cho tour",
  "destination.create": "thêm điểm đến", "post.create": "tạo bài viết", "post.update": "sửa bài viết", "post.delete": "xóa bài viết",
  "user.role": "đổi quyền tài khoản", "support.resolved": "xử lý xong yêu cầu hỗ trợ", "support.pending": "mở lại yêu cầu hỗ trợ",
};
const TYPES = [["", "Tất cả"], ["booking", "Đơn"], ["tour", "Tour"], ["departure", "Lịch đi"], ["post", "Blog"], ["user", "Tài khoản"], ["support", "Hỗ trợ"]];

// Tên đối tượng; loại nào có trang riêng thì gắn link để mở nhanh.
function Target({ log }) {
  if (log.entity_type === "booking") return <Link to={`/admin/bookings/${log.entity_id}`}>{bookingCode(log.entity_id)}</Link>;
  if (log.entity_type === "post" && log.action !== "post.delete") return <Link to={`/admin/blog/${log.entity_id}`}>{log.details?.title || `#${log.entity_id}`}</Link>;
  return <span>{log.details?.title || `#${log.entity_id}`}</span>;
}

export default function AdminActivityPage() {
  const [filters, setFilters] = useState({ page: 1, type: "" });
  const load = useCallback((signal) => getAdminActivity(filters, signal), [filters]);
  const { data, error, loading } = useLoad(load);

  return <><Header /><main className="container admin-page"><AdminNav />
    <p className="section-kicker">KIỂM SOÁT</p><h1>Nhật ký thao tác</h1>
    <p className="account-intro">Mọi thay đổi của quản trị viên đều được lưu lại tại đây.</p>

    <div className="admin-toolbar"><div className="admin-tabs" role="group" aria-label="Lọc theo loại">
      {TYPES.map(([value, label]) => <button key={label} type="button" aria-pressed={filters.type === value} onClick={() => setFilters({ type: value, page: 1 })}>{label}</button>)}
    </div></div>

    {error ? <div className="state-box" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={() => setFilters({ ...filters })}>Thử lại</button></div>
      : !data ? <p role="status">Đang tải nhật ký…</p>
      : data.items.length === 0 ? <div className="state-box"><p>Chưa có thao tác nào.</p></div>
      : <ol className={loading ? "activity-list is-loading" : "activity-list"}>{data.items.map((log) => <li key={log.id}>
        <time dateTime={log.created_at}>{formatDateTime(log.created_at)}</time>
        <p><strong>{log.actor_name}</strong> {ACTIONS[log.action] || log.action} <Target log={log} /></p>
        {log.details?.note && <small>Ghi chú: {log.details.note}</small>}
      </li>)}</ol>}
    {data && <AdminPager page={data.page} totalPages={data.total_pages} onPage={(page) => setFilters({ ...filters, page })} />}
  </main><Footer /></>;
}
