// Trang Dashboard quản trị (/admin): số liệu tổng quan, việc cần làm, doanh thu, tour bán chạy, đơn mới.
import { useCallback, useState } from "react";
import { Link } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import AdminNav from "../components/AdminNav.jsx";
import RevenueChart from "../components/RevenueChart.jsx";
import useLoad from "../hooks/useLoad.js";
import { getAdminOverview } from "../services/authApi.js";
import { getAdminInsights } from "../services/adminApi.js";
import { formatPrice } from "../utils/format.js";
import { bookingCode, bookingDate, paymentStatus } from "../utils/booking.js";
import { formatDateTime } from "../utils/blog.js";

export default function AdminPage() {
  // retry tăng lên khi bấm "Thử lại", làm hàm tải được tạo mới.
  const [retry, setRetry] = useState(0);
  const load = useCallback(async (signal) => {
    const [overview, insights] = await Promise.all([getAdminOverview(signal), getAdminInsights(signal)]);
    return { overview, insights, retry };
  }, [retry]);
  const { data, error } = useLoad(load);
  const overview = data?.overview, insights = data?.insights;

  // Danh sách việc cần làm: chỉ hiện những việc đang có số lượng lớn hơn 0.
  const todos = insights ? [
    { count: insights.todo.unpaid_departing_soon, label: "đơn chưa thanh toán, khởi hành trong 7 ngày", to: "/admin/bookings?payment=unpaid", urgent: true },
    { count: insights.support_pending ?? 0, label: "yêu cầu hỗ trợ đang chờ", to: "/admin/support", urgent: true },
    { count: insights.todo.unpaid_bookings, label: "đơn chưa thanh toán", to: "/admin/bookings?payment=unpaid" },
    { count: insights.low_tours.length, label: "tour đang bán sắp hết lịch khởi hành", to: "/admin/tours?status=active" },
    { count: insights.todo.almost_full_departures, label: "lịch khởi hành sắp kín chỗ", to: "/admin/tours" },
    { count: insights.blog?.drafts ?? 0, label: "bài viết còn ở bản nháp", to: "/admin/blog" },
  ].filter((item) => item.count > 0) : [];
  const topRevenue = Math.max(1, ...(insights?.top_tours ?? []).map((tour) => Number(tour.revenue)));

  return <><Header /><main className="container admin-page"><AdminNav />
    <div className="admin-title-row">
      <div><p className="section-kicker">QUẢN TRỊ VIÊN</p><h1>Tổng quan hệ thống</h1></div>
      <div className="admin-quick">
        <Link className="button button-primary" to="/admin/blog/new">Viết bài mới</Link>
        <Link className="button button-secondary" to="/admin/tours">Quản lý tour</Link>
      </div>
    </div>

    {error ? <div className="state-box" role="alert"><p>{error}</p><button className="button button-primary" type="button" onClick={() => setRetry((n) => n + 1)}>Thử lại</button></div>
      : !data ? <p role="status">Đang tải số liệu…</p> : <>
      <div className="admin-metrics">
        <article><p>Tiền đã ghi nhận, chưa hoàn</p><strong>{Number(overview.received_amount) === 0 ? "0 ₫" : formatPrice(overview.received_amount)}</strong></article>
        <article><p>Đơn còn hiệu lực</p><strong>{overview.confirmed_bookings_count}</strong></article>
        <article><p>Đơn đã hủy</p><strong>{overview.cancelled_bookings_count}</strong></article>
        <article><p>Tài khoản</p><strong>{overview.users_count}</strong></article>
        <article><p>Tour đang mở bán</p><strong>{overview.active_tours_count}</strong></article>
        <article><p>Lịch khởi hành còn chỗ</p><strong>{overview.available_departures_count}</strong></article>
      </div>

      <div className="admin-board">
        <section className="admin-panel admin-panel-wide">
          <h2>Tiền đã thu 6 tháng gần nhất</h2>
          <RevenueChart months={insights.months} />
        </section>

        <section className="admin-panel">
          <h2>Việc cần xử lý</h2>
          {todos.length === 0 ? <p className="admin-empty">Mọi việc đã xong. Không có gì đang chờ bạn.</p> : (
            <ul className="admin-todo">
              {todos.map((item) => <li key={item.label}><Link to={item.to}>
                <b className={item.urgent ? "is-urgent" : ""}>{item.count}</b><span>{item.label}</span><i aria-hidden="true">→</i>
              </Link></li>)}
            </ul>
          )}
        </section>

        <section className="admin-panel">
          <h2>Tour doanh thu cao nhất</h2>
          {insights.top_tours.length === 0 ? <p className="admin-empty">Chưa có đơn còn hiệu lực.</p> : (
            <ol className="admin-rank">
              {insights.top_tours.map((tour) => <li key={tour.id}>
                <div><span>{tour.title}</span><b>{formatPrice(tour.revenue)}</b></div>
                <span className="admin-meter"><span style={{ width: `${(Number(tour.revenue) / topRevenue) * 100}%` }} /></span>
                <small>{tour.bookings} đơn · {tour.guests} khách</small>
              </li>)}
            </ol>
          )}
        </section>

        <section className="admin-panel">
          <h2>Tour sắp hết lịch</h2>
          {insights.low_tours.length === 0 ? <p className="admin-empty">Các tour đang bán đều còn đủ lịch khởi hành.</p> : (
            <ul className="admin-list">
              {insights.low_tours.map((tour) => <li key={tour.id}>
                <span>{tour.title}<small>{tour.upcoming === 0 ? "Không còn lịch tương lai, tour đang bị ẩn khỏi trang chủ" : `Lịch cuối: ${bookingDate(tour.last_date)}`}</small></span>
                <Link className="button button-secondary" to={`/admin/tours?edit=${tour.id}&q=${encodeURIComponent(tour.title)}`}>Thêm lịch</Link>
              </li>)}
            </ul>
          )}
        </section>

        <section className="admin-panel">
          <h2>Đơn mới nhất</h2>
          {insights.recent_bookings.length === 0 ? <p className="admin-empty">Chưa có đơn nào.</p> : (
            <ul className="admin-list">
              {insights.recent_bookings.map((booking) => <li key={booking.id}>
                <span><Link to={`/admin/bookings/${booking.id}`}>{bookingCode(booking.id)} · {booking.contact_name}</Link><small>{booking.tour_title} · {formatDateTime(booking.created_at)}</small></span>
                <span className={`pill ${booking.status === "cancelled" ? "pill-muted" : booking.payment_status === "paid" ? "pill-good" : "pill-warn"}`}>{booking.status === "cancelled" ? "Đã hủy" : paymentStatus(booking.payment_status)}</span>
              </li>)}
            </ul>
          )}
        </section>
      </div>
    </>}
  </main><Footer /></>;
}
