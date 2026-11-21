// Đơn của tôi (/my-bookings?page=1).
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import useLoad from '../hooks/useLoad.js';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.js';
import { getMyBookings } from '../services/bookingApi.js';
import { bookingCode, bookingDate, bookingStatus } from '../utils/booking.js';
import { formatPrice } from '../utils/format.js';

export default function MyBookingsPage() {
  // trang lấy từ URL (?page=2), giá trị lạ thì về trang 1
  const [params, setParams] = useSearchParams();
  const parsedPage = Number(params.get('page') || 1);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 && parsedPage <= 1000000 ? parsedPage : 1;
  const [retry, setRetry] = useState(0);
  const { reload } = useAuth();
  // 401 (phiên hết hạn) thì kiểm tra lại đăng nhập
  const load = useCallback((signal) => getMyBookings(page, signal).catch((err) => {
    if (err.status === 401) reload();
    throw err;
  }), [page, reload]);
  const { data, error } = useLoad(load, retry);
  return <><Header /><main className="container booking-page">
    <p className="section-kicker">NHỮNG HÀNH TRÌNH CỦA BẠN</p><h1>Đơn của tôi</h1>
    <p className="booking-intro">Xem thông tin và trạng thái các tour bạn đã đặt.</p>
    {/* lỗi, đang tải, hoặc có dữ liệu (danh sách, hay thông báo chưa có đơn) */}
    {error ? <div className="state-box"><p role="alert">{error}</p><button className="button button-primary" onClick={() => setRetry((n) => n + 1)}>Thử lại</button></div>
      : !data ? <p role="status">Đang tải đơn đặt tour…</p>
        : <>{data.items.length ? <div className="booking-list">{data.items.map((booking) => <article className="booking-list-card" key={booking.id}>
          <div className="booking-list-meta"><span>{bookingCode(booking.id)}</span><span className={`booking-badge ${booking.status}`}>{bookingStatus(booking.status)}</span></div>
          <h2><Link to={`/my-bookings/${booking.id}`}>{booking.tour_title}</Link></h2>
          <p>Khởi hành {bookingDate(booking.departure_date)} <span aria-hidden="true">·</span> {booking.guest_count} người</p>
          <div className="booking-list-bottom"><strong>{formatPrice(booking.total_price)}</strong><Link className="button button-secondary" to={`/my-bookings/${booking.id}`}>Xem đơn</Link></div>
        </article>)}</div> : <div className="state-box"><h2>{page === 1 ? 'Bạn chưa có đơn đặt tour' : 'Không có đơn ở trang này'}</h2><p>Chọn một hành trình yêu thích để bắt đầu chuyến đi.</p><Link className="button button-primary" to="/#tours">Khám phá tour</Link></div>}
        {/* chỉ phân trang khi có hơn 1 trang */}
        {(data.total_pages > 1 || page > 1) && <nav className="booking-pagination" aria-label="Phân trang đơn đặt tour"><button className="button button-secondary" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1) })}>Trang trước</button><span>Trang {page} / {data.total_pages}</span><button className="button button-secondary" disabled={page >= data.total_pages} onClick={() => setParams({ page: String(page + 1) })}>Trang sau</button></nav>}</>}
  </main><Footer /></>;
}
