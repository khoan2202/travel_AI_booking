import { useEffect, useState } from "react";
import { Link } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { getAdminOverview } from "../services/authApi.js";
import AdminNav from "../components/AdminNav.jsx";
import { formatPrice } from "../utils/format.js";

export default function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getAdminOverview(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [retryCount]);
  function retry() { setError(""); setData(null); setRetryCount((count) => count + 1); }

  return <><Header /><main className="container admin-page"><AdminNav />
    <p className="section-kicker">QUẢN TRỊ VIÊN</p><h1>Tổng quan hệ thống</h1>
    <p className="account-intro">Số liệu hiện tại từ hệ thống Travel Mint.</p>
    {error ? <div className="state-box" role="alert"><p>{error}</p><button className="button button-primary" type="button" onClick={retry}>Thử lại</button></div> : data ? <div className="admin-metrics">
      <article><p>Tài khoản</p><strong>{data.users_count}</strong></article>
      <article><p>Tour đang mở bán</p><strong>{data.active_tours_count}</strong></article>
      <article><p>Lịch khởi hành còn chỗ</p><strong>{data.available_departures_count}</strong></article>
      <article><p>Đơn còn hiệu lực</p><strong>{data.confirmed_bookings_count}</strong></article>
      <article><p>Đơn đã hủy</p><strong>{data.cancelled_bookings_count}</strong></article>
      <article><p>Tiền đã ghi nhận, chưa hoàn</p><strong>{Number(data.received_amount) === 0 ? '0 ₫' : formatPrice(data.received_amount)}</strong></article>
    </div> : <p role="status">Đang tải số liệu…</p>}
    <Link className="button button-secondary admin-return" to="/account">Về tài khoản của tôi</Link>
  </main><Footer /></>;
}
