import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.js';
import { getBooking, cancelBooking } from '../services/bookingApi.js';
import { bookingCode, bookingDate, bookingStatus, paymentStatus } from '../utils/booking.js';
import { formatPrice } from '../utils/format.js';

function BookingDetail({ id }) {
  const location = useLocation();
  const { reload } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoadError(''); setBooking(null);
    getBooking(id, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setBooking(result); })
      .catch((err) => { if (!controller.signal.aborted) { setLoadError(err.message); if (err.status === 401) reload(); } });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, retry]);
  async function cancel() {
    if (sending) return;
    setSending(true); setError('');
    try {
      const result = await cancelBooking(id);
      setBooking(result.booking); setConfirming(false);
    } catch (err) { setError(err.message); if (err.status === 401) reload(); }
    finally { setSending(false); }
  }
  return <main className="container booking-page">
    <nav className="breadcrumbs" aria-label="Đường dẫn trang"><Link to="/my-bookings">Đơn của tôi</Link><span>/</span><span>Chi tiết đơn</span></nav>
    {loadError ? <div className="state-box"><h1>Chưa xem được đơn đặt tour</h1><p role="alert">{loadError}</p><button className="button button-secondary" onClick={() => setRetry((n) => n + 1)}>Thử lại</button><Link className="button button-primary" to="/my-bookings">Về Đơn của tôi</Link></div>
      : !booking ? <p role="status">Đang tải thông tin đơn…</p>
        : <>{location.state?.created && booking.status === 'confirmed' && <p className="auth-success" role="status">Đặt tour thành công. Chỗ của bạn đã được ghi nhận.</p>}
          <div className="booking-detail-heading"><div><p className="section-kicker">THÔNG TIN ĐẶT TOUR</p><h1>Đơn {bookingCode(booking.id)}</h1></div><span className={`booking-badge ${booking.status}`}>{bookingStatus(booking.status)}</span></div>
          <div className="booking-receipt"><section className="booking-receipt-main"><h2>{booking.tour_title}</h2>
            <dl className="booking-facts"><div><dt>Ngày khởi hành</dt><dd>{bookingDate(booking.departure_date)}</dd></div><div><dt>Số người</dt><dd>{booking.guest_count} người</dd></div><div><dt>Đơn giá lúc đặt</dt><dd>{formatPrice(booking.unit_price)}</dd></div><div><dt>Thanh toán</dt><dd>{paymentStatus(booking.payment_status)}</dd></div></dl>
            <div className="booking-total"><span>Tổng tiền lúc đặt</span><strong>{formatPrice(booking.total_price)}</strong></div>
            <p className="payment-note">{booking.status === 'cancelled' ? 'Đơn đã hủy. Số chỗ đã được trả lại cho lịch khởi hành.' : booking.payment_status === 'unpaid' ? 'Đơn này chưa thanh toán. Website chưa thu tiền trực tuyến ở bước đặt chỗ.' : paymentStatus(booking.payment_status)}</p>
          </section><section className="booking-receipt-contact"><h2>Người liên hệ</h2><dl className="profile-fields"><div><dt>Họ và tên</dt><dd>{booking.contact_name}</dd></div><div><dt>Email</dt><dd>{booking.contact_email}</dd></div><div><dt>Số điện thoại</dt><dd>{booking.contact_phone}</dd></div>{booking.notes && <div><dt>Ghi chú</dt><dd className="booking-notes">{booking.notes}</dd></div>}</dl></section></div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {booking.can_cancel && <section className="booking-cancel" aria-label="Hủy đơn đặt tour">
            {confirming ? <><h2>Bạn muốn hủy đơn này?</h2><p>Hủy toàn bộ {booking.guest_count} chỗ của đơn {bookingCode(booking.id)}. Muốn đi lại, bạn cần tạo đơn mới theo giá và số chỗ lúc đó.</p><div className="account-actions"><button className="button button-danger" type="button" disabled={sending} onClick={cancel}>{sending ? 'Đang hủy…' : 'Xác nhận hủy đơn'}</button><button className="button button-secondary" disabled={sending} onClick={() => setConfirming(false)}>Giữ lại đơn</button></div></>
              : <><p>Bạn có thể hủy đơn chưa thanh toán trước ngày khởi hành.</p><button className="button button-secondary" type="button" onClick={() => setConfirming(true)}>Hủy đơn đặt tour</button></>}
          </section>}
          <div className="account-actions booking-bottom-links"><Link className="button button-primary" to="/my-bookings">Về Đơn của tôi</Link><Link className="button button-secondary" to={`/tours/${booking.tour_id}`}>Xem lại tour</Link></div>
        </>}
  </main>;
}

export default function BookingDetailPage() {
  const { id } = useParams();
  return <><Header /><BookingDetail key={id} id={id} /><Footer /></>;
}
