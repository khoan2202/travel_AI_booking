// Hộp thư hỗ trợ: đọc tin khách gửi từ trang Liên hệ, xong thì đánh dấu đã xử lý.
import { useCallback, useState } from "react";
import { Link } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import AdminNav from "../components/AdminNav.jsx";
import AdminPager from "../components/AdminPager.jsx";
import useLoad from "../hooks/useLoad.js";
import { getAdminSupport, setSupportStatus } from "../services/adminApi.js";
import { bookingCode } from "../utils/booking.js";
import { formatDateTime } from "../utils/blog.js";

const TABS = [["pending", "Đang chờ"], ["resolved", "Đã xử lý"], ["", "Tất cả"]];

export default function AdminSupportPage() {
  const [filters, setFilters] = useState({ page: 1, status: "pending", q: "" });
  const [draft, setDraft] = useState("");
  const [busyId, setBusyId] = useState(null), [actionError, setActionError] = useState("");
  const load = useCallback((signal) => getAdminSupport(filters, signal), [filters]);
  const { data, error, loading } = useLoad(load);

  async function mark(item, status) {
    setBusyId(item.id); setActionError("");
    try { await setSupportStatus(item.id, status); setFilters((current) => ({ ...current })); }
    catch (err) { setActionError(err.message); } finally { setBusyId(null); }
  }

  return <><Header /><main className="container admin-page"><AdminNav />
    <p className="section-kicker">CHĂM SÓC KHÁCH HÀNG</p><h1>Yêu cầu hỗ trợ</h1>
    <p className="account-intro">{data ? `${data.pending} yêu cầu đang chờ phản hồi.` : "Các yêu cầu khách gửi từ trang Liên hệ."}</p>
    {actionError && <p className="auth-error" role="alert">{actionError}</p>}

    <div className="admin-toolbar">
      <div className="admin-tabs" role="group" aria-label="Lọc theo trạng thái">
        {TABS.map(([value, label]) => <button key={label} type="button" aria-pressed={filters.status === value} onClick={() => setFilters({ ...filters, status: value, page: 1 })}>{label}</button>)}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); setFilters({ ...filters, q: draft.trim(), page: 1 }); }}>
        <input aria-label="Tìm yêu cầu" placeholder="Tên, số điện thoại, nội dung" value={draft} maxLength="100" onChange={(event) => setDraft(event.target.value)} />
        <button className="button button-secondary">Tìm</button>
      </form>
    </div>

    {error ? <div className="state-box" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={() => setFilters({ ...filters })}>Thử lại</button></div>
      : !data ? <p role="status">Đang tải yêu cầu…</p>
      : data.items.length === 0 ? <div className="state-box"><p>{filters.status === "pending" ? "Không còn yêu cầu nào đang chờ." : "Không có yêu cầu phù hợp."}</p></div>
      : <ul className={loading ? "support-list is-loading" : "support-list"}>{data.items.map((item) => <li key={item.id} className={item.status === "pending" ? "is-pending" : ""}>
        <div className="support-head">
          <div><strong>{item.full_name}</strong><small>{formatDateTime(item.created_at)}{item.user_email ? ` · ${item.user_email}` : " · Khách chưa đăng nhập"}</small></div>
          <span className={`pill ${item.status === "pending" ? "pill-warn" : "pill-good"}`}>{item.status === "pending" ? "Đang chờ" : "Đã xử lý"}</span>
        </div>
        <p className="support-message">{item.message}</p>
        <div className="admin-row-actions">
          <a className="button button-secondary" href={`tel:${item.phone}`}>Gọi {item.phone}</a>
          {item.booking_id && <Link className="button button-secondary" to={`/admin/bookings/${item.booking_id}`}>Đơn {bookingCode(item.booking_id)}</Link>}
          <button className={item.status === "pending" ? "button button-primary" : "button button-secondary"} type="button" disabled={busyId === item.id} onClick={() => mark(item, item.status === "pending" ? "resolved" : "pending")}>
            {item.status === "pending" ? "Đánh dấu đã xử lý" : "Mở lại"}
          </button>
        </div>
      </li>)}</ul>}
    {data && <AdminPager page={data.page} totalPages={data.total_pages} onPage={(page) => setFilters({ ...filters, page })} />}
  </main><Footer /></>;
}
