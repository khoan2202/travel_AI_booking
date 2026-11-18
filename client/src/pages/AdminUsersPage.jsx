// Khách hàng: tìm tài khoản, xem số đơn và tiền đã trả, đổi quyền.
import { useCallback, useState } from "react";
import { Link } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import AdminNav from "../components/AdminNav.jsx";
import AdminPager from "../components/AdminPager.jsx";
import useLoad from "../hooks/useLoad.js";
import { getAdminUsers, setUserRole } from "../services/adminApi.js";
import { formatDate } from "../utils/blog.js";
import { formatPrice } from "../utils/format.js";

export default function AdminUsersPage() {
  const [filters, setFilters] = useState({ page: 1, role: "", q: "" });
  const [draft, setDraft] = useState({ q: "", role: "" });
  // tài khoản đang chờ bấm xác nhận đổi quyền
  const [confirmId, setConfirmId] = useState(null);
  const [busy, setBusy] = useState(false), [actionError, setActionError] = useState(""), [notice, setNotice] = useState("");
  const load = useCallback((signal) => getAdminUsers(filters, signal), [filters]);
  const { data, error, loading } = useLoad(load);

  async function changeRole(user) {
    const role = user.role === "admin" ? "user" : "admin";
    setBusy(true); setActionError(""); setNotice("");
    try {
      await setUserRole(user.id, role);
      setNotice(role === "admin" ? `${user.name} đã có quyền quản trị.` : `Đã gỡ quyền quản trị của ${user.name}.`);
      setConfirmId(null);
      setFilters((current) => ({ ...current }));
    } catch (err) { setActionError(err.message); } finally { setBusy(false); }
  }

  return <><Header /><main className="container admin-page"><AdminNav />
    <p className="section-kicker">CON NGƯỜI</p><h1>Khách hàng & tài khoản</h1>
    <p className="account-intro">Xem lịch sử mua của từng khách và phân quyền quản trị.</p>
    {actionError && <p className="auth-error" role="alert">{actionError}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}

    <div className="admin-toolbar"><form onSubmit={(event) => { event.preventDefault(); setFilters({ ...draft, q: draft.q.trim(), page: 1 }); }}>
      <input aria-label="Tìm tài khoản" placeholder="Tên hoặc email" value={draft.q} maxLength="100" onChange={(event) => setDraft({ ...draft, q: event.target.value })} />
      <select aria-label="Quyền" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })}><option value="">Tất cả quyền</option><option value="user">Khách hàng</option><option value="admin">Quản trị viên</option></select>
      <button className="button button-primary">Lọc</button>
    </form></div>

    {error ? <div className="state-box" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={() => setFilters({ ...filters })}>Thử lại</button></div>
      : !data ? <p role="status">Đang tải tài khoản…</p>
      : data.items.length === 0 ? <div className="state-box"><p>Không có tài khoản phù hợp.</p></div>
      : <div className={loading ? "admin-table-wrap is-loading" : "admin-table-wrap"}><table className="admin-table">
        <caption>{data.total} tài khoản</caption>
        <thead><tr><th>Tài khoản</th><th>Quyền</th><th>Số đơn</th><th>Đã thanh toán</th><th>Ngày tham gia</th><th>Thao tác</th></tr></thead>
        <tbody>{data.items.map((user) => <tr key={user.id}>
          <td>{user.name}{user.id === data.me && " (bạn)"}<small>{user.email}</small></td>
          <td><span className={`pill ${user.role === "admin" ? "pill-good" : "pill-muted"}`}>{user.role === "admin" ? "Quản trị viên" : "Khách hàng"}</span></td>
          <td>{user.bookings_count}</td>
          <td>{Number(user.paid_total) > 0 ? formatPrice(user.paid_total) : "0 ₫"}</td>
          <td>{formatDate(user.created_at)}</td>
          <td><div className="admin-row-actions">
            {user.bookings_count > 0 && <Link className="button button-secondary" to={`/admin/bookings?q=${encodeURIComponent(user.email)}`}>Xem đơn</Link>}
            {user.id !== data.me && (confirmId === user.id
              ? <><button className="button button-danger" type="button" disabled={busy} onClick={() => changeRole(user)}>Xác nhận</button><button className="button button-secondary" type="button" onClick={() => setConfirmId(null)}>Thôi</button></>
              : <button className="button button-secondary" type="button" onClick={() => { setConfirmId(user.id); setNotice(""); setActionError(""); }}>{user.role === "admin" ? "Gỡ quyền admin" : "Cấp quyền admin"}</button>)}
          </div></td>
        </tr>)}</tbody>
      </table></div>}
    {data && <AdminPager page={data.page} totalPages={data.total_pages} onPage={(page) => setFilters({ ...filters, page })} />}
  </main><Footer /></>;
}
