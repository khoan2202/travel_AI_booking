import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import TourImage from '../components/TourImage.jsx';
import { useAuth } from '../context/AuthContext.js';
import { getTourById, getTourDepartures } from '../services/tourApi.js';
import { createBooking } from '../services/bookingApi.js';
import { formatPrice } from '../utils/format.js';
import { bookingDate, checkoutPath, readPending, savePending, clearPending } from '../utils/booking.js';

function BookingForm({ user, tourId, departureId, guests }) {
  const navigate = useNavigate();
  const { reload } = useAuth();
  const [pending, setPending] = useState(() => readPending(user.id));
  const [name, setName] = useState(pending?.body.contact_name || user.name);
  const [phone, setPhone] = useState(pending?.body.contact_phone || '');
  const [notes, setNotes] = useState(pending?.body.notes || '');
  const [agreed, setAgreed] = useState(false);
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [sending, setSending] = useState(false);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const validParams = [tourId, departureId].every((id) => Number.isInteger(id) && id > 0 && id <= 2147483647)
    && Number.isInteger(guests) && guests >= 1 && guests <= 20;
  const pendingMatches = pending && pending.tourId === tourId
    && pending.body.departure_id === departureId && pending.body.guest_count === guests;

  useEffect(() => {
    if (!validParams) return;
    const controller = new AbortController();
    setData(null); setLoadError(''); setAgreed(false);
    Promise.all([getTourById(tourId, controller.signal), getTourDepartures(tourId, controller.signal)])
      .then(([tour, departures]) => {
        if (!controller.signal.aborted) {
          setData({ tour, departure: departures.find((item) => item.id === departureId) });
          setNeedsRefresh(false);
        }
      })
      .catch((err) => { if (!controller.signal.aborted) setLoadError(err.message); });
    return () => controller.abort();
  }, [tourId, departureId, retry, validParams]);

  const departure = data?.departure;
  const enoughSeats = departure && departure.available_seats >= guests;
  const total = departure ? Number(departure.price_per_person) * guests : 0;

  async function submit(event) {
    event.preventDefault();
    if (sending) return;
    setError('');
    let attempt = pending;
    if (!attempt) {
      if (!agreed || !enoughSeats || needsRefresh) return;
      const normalizedPhone = phone.replace(/[\s().-]/g, '');
      if (!/^\+?\d{9,15}$/.test(normalizedPhone) || name.trim().length < 2) {
        setError('Nhập họ tên và số điện thoại hợp lệ (9–15 chữ số).'); return;
      }
      attempt = { tourId, body: {
        departure_id: departureId, guest_count: guests, expected_unit_price: String(departure.price_per_person),
        contact_name: name.trim(), contact_phone: normalizedPhone, notes: notes.trim(), request_key: crypto.randomUUID(),
      } };
      try { savePending(user.id, attempt); }
      catch { setError('Trình duyệt chưa lưu được yêu cầu. Hãy cho phép lưu trữ trang web rồi thử lại.'); return; }
      setPending(attempt);
    }
    setSending(true);
    try {
      const { booking } = await createBooking(attempt.body);
      clearPending(user.id);
      navigate(`/my-bookings/${booking.id}`, { replace: true, state: { created: booking.status === 'confirmed' } });
    } catch (err) {
      setError(err.message);
      if (err.status === 401) reload();
      // Đây là các lỗi xác định chưa tạo đơn. Lỗi mạng/5xx giữ nguyên mã để thử lại an toàn.
      if (err.status === 400 || err.status === 404 || ['PRICE_CHANGED', 'DEPARTURE_CLOSED', 'INSUFFICIENT_SEATS'].includes(err.code)) {
        clearPending(user.id); setPending(null); setNeedsRefresh(true); setAgreed(false);
      }
    } finally { setSending(false); }
  }

  return <main className="container booking-page">
    <nav className="breadcrumbs" aria-label="Đường dẫn trang"><Link to="/#tours">Khám phá tour</Link><span>/</span><span>Đặt tour</span></nav>
    <p className="section-kicker">CHUẨN BỊ CHO HÀNH TRÌNH</p><h1>Xác nhận đặt tour</h1>
    <p className="booking-intro">Kiểm tra lịch đi, thông tin liên hệ và tổng tiền trước khi xác nhận.</p>
    {error && <p role="alert" className="auth-error">{error}</p>}
    {pending && <section className="booking-pending" aria-label="Yêu cầu đang chờ kết quả">
      <h2>{sending ? 'Đang xác nhận yêu cầu' : 'Kiểm tra kết quả đặt tour'}</h2>
      <p>{sending ? 'Vui lòng chờ hệ thống xác nhận kết quả đặt tour.' : 'Yêu cầu trước chưa nhận được xác nhận. Gửi lại cùng yêu cầu để lấy kết quả; hệ thống sẽ nhận diện đơn đã tạo.'}</p>
      {pendingMatches ? <button className="button button-primary" type="button" disabled={sending} onClick={submit}>{sending ? 'Đang kiểm tra…' : 'Thử lại cùng yêu cầu'}</button>
        : <Link className="button button-primary" to={checkoutPath(pending.tourId, pending.body.departure_id, pending.body.guest_count)}>Tiếp tục yêu cầu trước</Link>}
      <Link className="pending-history-link" to="/my-bookings">Kiểm tra Đơn của tôi</Link>
    </section>}
    {!validParams ? <div className="state-box"><h2>Lựa chọn chưa hợp lệ</h2><p>Quay về trang tour để chọn lịch và từ 1 đến 20 người.</p><Link className="button button-primary" to="/#tours">Chọn tour</Link></div>
      : loadError ? <div className="state-box"><p role="alert">{loadError}</p><button className="button button-secondary" onClick={() => setRetry((n) => n + 1)}>Tải lại thông tin</button></div>
        : !data ? <p role="status">Đang kiểm tra lịch và giá tour…</p>
          : !departure || !enoughSeats ? <div className="state-box"><h2>Lịch đã chọn không còn đủ chỗ</h2><p>Chọn lại lịch hoặc số người để tiếp tục.</p><Link className="button button-primary" to={`/tours/${tourId}`}>Về trang tour</Link></div>
            : <div className="checkout-layout">
              <section className="checkout-contact"><h2>Thông tin liên hệ</h2>
                <form className="auth-form booking-form" onSubmit={submit}>
                  <fieldset disabled={sending || Boolean(pending)}>
                    <label htmlFor="contact-name">Họ và tên<input id="contact-name" autoComplete="name" required minLength="2" maxLength="100" value={name} onChange={(e) => setName(e.target.value)} /></label>
                    <label htmlFor="contact-phone">Số điện thoại<input id="contact-phone" type="tel" autoComplete="tel" required maxLength="30" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ví dụ: 0901234567" /></label>
                    <label htmlFor="contact-email">Email tài khoản<input id="contact-email" type="email" value={user.email} readOnly /></label>
                    <label htmlFor="booking-notes">Ghi chú cho chuyến đi <span className="optional-note">(không bắt buộc)</span><textarea id="booking-notes" maxLength="500" rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Yêu cầu hỗ trợ hoặc lưu ý cho đoàn…" /></label>
                    <p className="booking-policy">Đơn được giữ chỗ ngay khi tạo thành công và ở trạng thái chưa thanh toán. Bạn có thể hủy đơn chưa thanh toán trước ngày khởi hành trong Đơn của tôi.</p>
                    <label className="booking-agreement"><input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>Tôi đã kiểm tra thông tin và đồng ý đặt tour với tổng tiền trên trang.</span></label>
                    <button className="button button-primary booking-submit" disabled={!agreed || needsRefresh || sending || Boolean(pending)} type="submit">{sending ? 'Đang tạo đơn…' : 'Xác nhận đặt tour'}</button>
                  </fieldset>
                </form>
                {!pending && <button className="booking-refresh" type="button" onClick={() => { setError(''); setRetry((n) => n + 1); }}>Cập nhật giá và chỗ</button>}
              </section>
              <aside className="checkout-summary" aria-label="Tóm tắt chuyến đi">
                <TourImage tour={data.tour} /><div className="checkout-summary-body"><p className="section-kicker">CHUYẾN ĐI CỦA BẠN</p><h2>{data.tour.title}</h2>
                  <dl className="booking-facts"><div><dt>Khởi hành</dt><dd>{bookingDate(departure.start_date)}</dd></div><div><dt>Số người</dt><dd>{guests} người</dd></div><div><dt>Giá mỗi người</dt><dd>{formatPrice(departure.price_per_person)}</dd></div></dl>
                  <div className="booking-total"><span>Tổng tiền</span><strong>{formatPrice(total)}</strong></div><p className="payment-note">Chưa thanh toán · Chưa thu tiền ở bước này.</p>
                  <Link to={`/tours/${tourId}`}>Đổi lịch hoặc số người →</Link>
                </div>
              </aside>
            </div>}
  </main>;
}

export default function BookingPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  return <><Header /><BookingForm key={`${user.id}:${location.search}`} user={user} tourId={Number(params.get('tour'))} departureId={Number(params.get('departure'))} guests={Number(params.get('guests'))} /><Footer /></>;
}
