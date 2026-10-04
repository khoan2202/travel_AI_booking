import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import TourImage from '../components/TourImage.jsx';
import { useAuth } from '../context/AuthContext.js';
import { request, postAuth } from '../services/authApi.js';
import { formatPrice } from '../utils/format.js';
import { bookingDate } from '../utils/booking.js';
const initial = { budget: '', days: '', guests: '1', region: '', interest: '' };
function Suggestions({ items, guests }) {
  return <div className="suggestion-grid">{items.map(t => <article className="suggestion-card" key={t.id}>
    <TourImage tour={t} /><div className="suggestion-body"><p className="tour-destination">{t.destination} · {t.duration_days} ngày</p><h3>{t.title}</h3>
    {t.reason && <p className="suggestion-reason">{t.reason}</p>}<p className="suggestion-date">Đi {bookingDate(t.start_date)} · còn {t.seats_left} chỗ</p>
    <strong>{formatPrice(t.price_from)} <small>/ người</small></strong><Link className="button button-secondary" to={`/booking?tour=${t.id}&departure=${t.departure_id}&guests=${guests}`}>Chọn lịch này ↗</Link><Link className="suggestion-detail" to={`/tours/${t.id}`}>Xem chi tiết hành trình</Link></div>
  </article>)}</div>;
}
export default function RecommendationPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(initial), [filters, setFilters] = useState(initial);
  const [options, setOptions] = useState({ regions: [], interests: [] });
  const [items, setItems] = useState(null), [error, setError] = useState(''), [reload, setReload] = useState(0);
  const [message, setMessage] = useState(''), [messages, setMessages] = useState([]), [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false), [chatError, setChatError] = useState('');
  useEffect(() => {
    const ctrl = new AbortController(); setItems(null); setError('');
    Promise.all([request('/recommendations/options', { signal: ctrl.signal }), request('/recommendations?' + new URLSearchParams(filters), { signal: ctrl.signal })])
      .then(([o, r]) => { if (!ctrl.signal.aborted) { setOptions(o); setItems(r.items); } }).catch(e => { if (!ctrl.signal.aborted) setError(e.message); });
    return () => ctrl.abort();
  }, [filters, reload]);
  useEffect(() => { setMessages([]); setResult(null); setChatError(''); }, [user?.id]);
  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
  function filter(event) { event.preventDefault(); setFilters({ ...form }); setMessages([]); setResult(null); setChatError(''); }
  async function send(event) {
    event.preventDefault(); const question = message.trim(); if (!question || busy) return;
    setBusy(true); setChatError('');
    try {
      const response = await postAuth('/recommendations/consult', { message: question, filters, history: messages.slice(-4).map(m => ({ role: m.role, text: m.text.slice(0, 700) })) });
      setMessages(m => [...m, { role: 'user', text: question }, { role: 'assistant', text: response.answer, source: response.source }].slice(-6));
      setResult(response); setMessage('');
    } catch(e) { setChatError(e.message); } finally { setBusy(false); }
  }
  return <><Header /><main className="container ai-page"><div className="ai-heading"><div><p className="section-kicker">YOUR NEXT JOURNEY</p><h1>Chuyến đi hợp với bạn.</h1><p>Chọn nhu cầu, khám phá tour còn chỗ và trò chuyện cùng trợ lý du lịch.</p></div><span className="ai-label">TRAVEL MINT ASSISTANT ✦</span></div>
    <section className="ai-filter"><h2>Bạn muốn đi thế nào?</h2><form onSubmit={filter}><fieldset disabled={busy} className="ai-filter-fields">
      <label>Ngân sách tối đa / người (VND)<input type="number" min="1" max="999999999999" step="1" placeholder="Ví dụ: 4000000" value={form.budget} onChange={e => change('budget', e.target.value)} /></label>
      <label>Số ngày tối đa<input type="number" min="1" max="60" placeholder="Không giới hạn" value={form.days} onChange={e => change('days', e.target.value)} /></label>
      <label>Số khách<input type="number" min="1" max="20" required value={form.guests} onChange={e => change('guests', e.target.value)} /></label>
      <label>Khu vực<select value={form.region} onChange={e => change('region', e.target.value)}><option value="">Tất cả khu vực</option>{options.regions.map(r => <option key={r}>{r}</option>)}</select></label>
      <label>Sở thích<select value={form.interest} onChange={e => change('interest', e.target.value)}><option value="">Tất cả sở thích</option>{options.interests.map(t => <option key={t}>{t}</option>)}</select></label>
      <button className="button button-primary" type="submit">Tìm tour phù hợp</button>
    </fieldset></form><p className="ai-note">Bộ lọc áp dụng khi bấm Tìm tour. Mỗi tour hiển thị lịch có giá thấp nhất thỏa điều kiện; tối đa 12 tour.</p></section>
    <section className="ai-results"><div className="ai-section-title"><h2>Gợi ý theo nhu cầu</h2><span>{items ? `${items.length} hành trình` : 'Đang tìm…'}</span></div>
    {error ? <div className="auth-error" role="alert">{error} <button className="button button-secondary" onClick={() => setReload(n => n + 1)}>Thử tải lại</button></div> : items === null ? <p role="status">Đang tìm lịch còn đủ chỗ…</p> : !items.length ? <p className="ai-empty">Chưa có tour phù hợp. Thử tăng ngân sách, số ngày hoặc đổi khu vực.</p> : <Suggestions items={items} guests={filters.guests} />}</section>
    <section className="ai-chat"><p className="section-kicker">THÊM MỘT GÓC NHÌN</p><h2>Hỏi trợ lý du lịch</h2><p className="ai-note">Trợ lý so sánh tour trong bộ lọc đang áp dụng. Giá và chỗ được xác nhận lại lúc đặt. Nội dung bạn nhập được gửi tới Gemini khi AI sẵn sàng; không nhập thông tin cá nhân hay thanh toán.</p>
    {!user ? <p className="ai-signin"><Link to="/login" state={{ from: '/recommendations' }}>Đăng nhập</Link> để trò chuyện với trợ lý. Bạn vẫn có thể xem gợi ý phía trên.</p> : <>
      <div className="ai-conversation" aria-live="polite">{messages.length === 0 && <p className="ai-empty">Ví dụ: “Hai người thích biển và nghỉ ngơi, tour nào hợp hơn?”</p>}{messages.map((m, i) => <article className={'ai-message ' + m.role} key={i}><strong>{m.role === 'user' ? 'Bạn' : m.source === 'gemini' ? 'Gemini AI' : 'Gợi ý từ dữ liệu'}</strong><p>{m.text}</p></article>)}</div>
      {chatError && <p role="alert" className="auth-error">{chatError}</p>}
      <form className="ai-chat-form" onSubmit={send}><label>Câu hỏi của bạn<textarea required minLength="3" maxLength="1200" rows="3" value={message} onChange={e => setMessage(e.target.value)} disabled={busy} placeholder="Chia sẻ mong muốn cho chuyến đi…" /></label><div className="account-actions"><button className="button button-primary" disabled={busy || !message.trim()}>{busy ? 'Đang tư vấn…' : 'Gửi câu hỏi'}</button><button className="button button-secondary" type="button" disabled={busy} onClick={() => { setMessages([]); setResult(null); setChatError(''); }}>Cuộc trò chuyện mới</button></div></form>
      {result?.recommendations?.length > 0 && <div className="ai-chat-picks"><h3>{result.source === 'gemini' ? 'Các tour trợ lý đề xuất' : 'Tour theo bộ lọc'}</h3><Suggestions items={result.recommendations} guests={filters.guests} /></div>}
    </>}</section>
  </main><Footer /></>;
}
