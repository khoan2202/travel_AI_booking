// Quản lý tour: tìm, tạo, sửa, thêm điểm đến, và lo lịch khởi hành của từng tour.
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import AdminNav from '../components/AdminNav.jsx';
import { getDestinations, getAdminTours, saveDestination, saveTour, getAdminDepartures, saveDeparture, setTourStatus, duplicateTour, createBulkDepartures } from '../services/adminApi.js';
import { formatPrice } from '../utils/format.js';
import { bookingDate } from '../utils/booking.js';

// giá trị ban đầu khi tạo tour hoặc lịch mới
const emptyTour = { title: '', slug: '', description: '', destination_id: '', duration_days: 3, departure_location: 'TP. Hồ Chí Minh', image_url: '', tags: '', status: 'draft' };
const emptyDeparture = { start_date: '', price_per_person: '', capacity: 25, status: 'scheduled' };
// mặc định 6 lịch, cách nhau 30 ngày
const emptyBulk = { start_date: '', every_days: 30, count: 6, price_per_person: '', capacity: 25 };
// nhãn tiếng Việt của trạng thái
const tourStatuses = { draft: 'Bản nháp', active: 'Đang bán', archived: 'Ngừng bán' };
const departureStatuses = { scheduled: 'Nhận đặt', cancelled: 'Đã hủy', completed: 'Hoàn tất' };
// "Đà Lạt 3 ngày" -> "da-lat-3-ngay"
function slugify(value) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function AdminToursPage() {
  // list: tour đang xem; version tăng thì tải lại; form: tour đang sửa (null = đóng); dep: form lịch đi.
  // Link từ Dashboard có thể kèm ?status=active (lọc sẵn) hoặc ?edit=12 (mở sẵn tour cần thêm lịch).
  const [params] = useSearchParams();
  const editId = Number(params.get('edit')) || null;
  const [statusFilter, setStatusFilter] = useState(tourStatuses[params.get('status')] ? params.get('status') : '');
  const [bulk, setBulk] = useState(emptyBulk);
  const openedEdit = useRef(false);
  const [destinations, setDestinations] = useState([]), [list, setList] = useState(null);
  // ?q= để tìm đúng tour cần mở, dù nó không nằm ở trang đầu
  const [page, setPage] = useState(1), [query, setQuery] = useState(params.get('q') || ''), [search, setSearch] = useState(params.get('q') || ''), [version, setVersion] = useState(0);
  // nhớ lịch này của tour nào, kẻo mở tour khác mà vẫn thấy lịch cũ
  const [form, setForm] = useState(null), [depState, setDepState] = useState({ tourId: null, list: null }), [dep, setDep] = useState(emptyDeparture);
  const formId = form?.id;
  const departures = depState.tourId === formId ? depState.list : null;
  const [destination, setDestination] = useState({ name: '', slug: '', region: '' });
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  // đổi trang, đổi từ khóa hoặc vừa lưu xong thì tải lại
  useEffect(() => {
    const ctrl = new AbortController();
    Promise.all([getDestinations(ctrl.signal), getAdminTours(page, search, statusFilter, ctrl.signal)])
      .then(([d, t]) => {
        if (ctrl.signal.aborted) return;
        setDestinations(d); setList(t); setError('');
        // tour được chọn từ Dashboard thì mở sẵn form (chỉ một lần)
        const target = !openedEdit.current && editId && t.items.find(item => item.id === editId);
        if (target) { openedEdit.current = true; setForm({ ...target, image_url: target.image_url || '', tags: target.tags.join(', ') }); }
      })
      .catch(e => { if (!ctrl.signal.aborted) setError(e.message); });
    return () => ctrl.abort();
  }, [page, search, statusFilter, version, editId]);
  // mở tour nào thì tải lịch của tour đó
  useEffect(() => {
    if (!formId) return undefined;
    const ctrl = new AbortController();
    getAdminDepartures(formId, ctrl.signal).then(d => { if (!ctrl.signal.aborted) setDepState({ tourId: formId, list: d }); }).catch(e => { if (!ctrl.signal.aborted) setError(e.message); });
    return () => ctrl.abort();
  }, [formId, version]);
  const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
  // tags là mảng nên đổi thành chuỗi "a, b, c" cho ô nhập; mở tour khác thì form lịch về trống
  function edit(tour) { setForm({ ...tour, image_url: tour.image_url || '', tags: tour.tags.join(', ') }); setDep(emptyDeparture); setError(''); setNotice(''); }
  // bọc mọi thao tác lưu: bật/tắt "bận", báo lỗi, xong thì tải lại
  async function act(work) { setBusy(true); setError(''); setNotice(''); try { await work(); setVersion(n => n + 1); } catch(e) { setError(e.message); } finally { setBusy(false); } }
  // đổi số và mảng tag về đúng kiểu trước khi gửi
  function submitTour(event) {
    event.preventDefault(); act(async () => {
      const saved = await saveTour(form.id, { ...form, destination_id: Number(form.destination_id), duration_days: Number(form.duration_days), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
      edit(saved); setNotice('Đã lưu tour. Thêm lịch tương lai còn chỗ để tour đang bán xuất hiện ngoài trang chủ.');
    });
  }
  function submitDeparture(event) { event.preventDefault(); act(async () => { await saveDeparture(form.id, dep.id, { ...dep, capacity: Number(dep.capacity) }); setDep(emptyDeparture); setNotice('Đã lưu lịch khởi hành.'); }); }
  // báo rõ tạo được mấy lịch và bỏ qua mấy ngày trùng
  function submitBulk(event) {
    event.preventDefault(); act(async () => {
      const result = await createBulkDepartures(form.id, { ...bulk, every_days: Number(bulk.every_days), count: Number(bulk.count), capacity: Number(bulk.capacity) });
      setBulk(emptyBulk); setNotice(`Đã tạo ${result.created} lịch${result.skipped ? `, bỏ qua ${result.skipped} ngày đã có lịch` : ''}.`);
    });
  }
  // nhân bản xong mở luôn bản sao để sửa
  function copyTour(tour) { act(async () => { const copy = await duplicateTour(tour.id); edit(copy); setNotice(`Đã tạo bản nháp từ tour #${tour.id}. Hãy sửa thông tin và thêm lịch khởi hành.`); }); }
  function quickStatus(tour, status) { act(async () => { await setTourStatus(tour.id, status); setNotice(`Tour #${tour.id}: ${tourStatuses[status]}.`); }); }
  return <><Header /><main className="container admin-page"><AdminNav /><p className="section-kicker">QUẢN LÝ DANH MỤC</p><h1>Tour & lịch khởi hành</h1>
    <p className="account-intro">Tạo hành trình, cập nhật giá và quản lý số chỗ của từng đợt đi.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}{notice && <p className="auth-success" role="status">{notice}</p>}
    <div className="admin-toolbar"><form onSubmit={e => { e.preventDefault(); setPage(1); setSearch(query); }}><input aria-label="Tìm tour quản trị" placeholder="Tên tour hoặc điểm đến" value={query} onChange={e => setQuery(e.target.value)} maxLength="100" /><select aria-label="Lọc trạng thái tour" value={statusFilter} onChange={e => { setPage(1); setStatusFilter(e.target.value); }}><option value="">Tất cả trạng thái</option>{Object.entries(tourStatuses).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><button className="button button-secondary">Tìm</button></form><button className="button button-primary" onClick={() => { setForm({ ...emptyTour }); setDep(emptyDeparture); setNotice(''); setError(''); }}>Tạo tour mới</button></div>
    {!list ? !error && <p role="status">Đang tải danh sách…</p> : <><div className="admin-table-wrap"><table className="admin-table"><caption>Danh sách tour ({list.total})</caption><thead><tr><th>Tour</th><th>Điểm đến</th><th>Lịch sắp tới</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{list.items.map(t => <tr key={t.id}><td>{t.title}<small>{t.duration_days} ngày · #{t.id}</small></td><td>{t.destination}</td><td>{t.status === 'active' && t.upcoming_departures < 2 ? <span className="pill pill-warn">{t.upcoming_departures === 0 ? 'Hết lịch' : 'Sắp hết lịch'}</span> : `${t.upcoming_departures} lịch`}{t.next_departure && <small>Gần nhất {bookingDate(t.next_departure)}</small>}</td><td><select className="admin-inline-select" aria-label={`Trạng thái tour #${t.id}`} value={t.status} disabled={busy} onChange={e => quickStatus(t, e.target.value)}>{Object.entries(tourStatuses).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td><td><div className="admin-row-actions"><button className="button button-secondary" onClick={() => edit(t)}>Sửa tour #{t.id}</button><button className="button button-secondary" disabled={busy} aria-label={`Nhân bản tour #${t.id}`} onClick={() => copyTour(t)}>Nhân bản</button></div></td></tr>)}</tbody></table></div><div className="booking-pagination"><button className="button button-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trang trước</button><span>{page} / {list.total_pages}</span><button className="button button-secondary" disabled={page >= list.total_pages} onClick={() => setPage(p => p + 1)}>Trang sau</button></div></>}
    <details className="admin-destination"><summary>Thêm điểm đến mới</summary><form className="admin-form" onSubmit={e => { e.preventDefault(); act(async () => { await saveDestination(destination); setDestination({ name: '', slug: '', region: '' }); setNotice('Đã thêm điểm đến.'); }); }}><fieldset disabled={busy}><label>Tên điểm đến<input required minLength="2" maxLength="100" value={destination.name} onChange={e => setDestination({ ...destination, name: e.target.value, slug: slugify(e.target.value) })} /></label><label>Slug điểm đến<input required value={destination.slug} onChange={e => setDestination({ ...destination, slug: e.target.value })} /></label><label>Khu vực<input required placeholder="Ví dụ: Miền Trung" value={destination.region} onChange={e => setDestination({ ...destination, region: e.target.value })} maxLength="50" /></label><button className="button button-primary">Lưu điểm đến</button></fieldset></form></details>
    {form && <section className="admin-editor"><h2>{form.id ? `Sửa tour #${form.id}` : 'Tạo tour mới'}</h2><form className="admin-form" onSubmit={submitTour}><fieldset disabled={busy}>
      {/* tour đã có thì giữ slug cũ để không đổi đường dẫn */}
      <label>Tên tour<input required minLength="5" maxLength="200" value={form.title} onChange={e => { const title = e.target.value; setForm(f => ({ ...f, title, slug: f.id ? f.slug : slugify(title) })); }} /></label>
      <div className="admin-form-grid"><label>Slug tour<input required maxLength="220" value={form.slug} onChange={e => change('slug', e.target.value)} /></label><label>Điểm đến<select required value={form.destination_id} onChange={e => change('destination_id', e.target.value)}><option value="">Chọn điểm đến</option>{destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label>Số ngày<input type="number" min="1" max="60" required value={form.duration_days} onChange={e => change('duration_days', e.target.value)} /></label><label>Nơi xuất phát<input required maxLength="100" value={form.departure_location} onChange={e => change('departure_location', e.target.value)} /></label></div>
      <label>Mô tả / lịch trình<textarea required minLength="20" maxLength="5000" rows="6" value={form.description} onChange={e => change('description', e.target.value)} /></label><label>URL ảnh HTTPS (để trống dùng ảnh minh họa)<input type="url" maxLength="2000" value={form.image_url} onChange={e => change('image_url', e.target.value)} /></label><label>Tags, ngăn cách bằng dấu phẩy<input value={form.tags} onChange={e => change('tags', e.target.value)} placeholder="biển, nghỉ dưỡng, gia đình" /></label><label>Trạng thái tour<select value={form.status} onChange={e => change('status', e.target.value)}>{Object.entries(tourStatuses).map(([v,l]) => <option value={v} key={v}>{l}</option>)}</select></label><p className="admin-hint">Ngừng bán sẽ ẩn tour khỏi danh sách công khai. Các đơn đã tạo vẫn được giữ lại để xử lý.</p><div className="account-actions"><button className="button button-primary">{busy ? 'Đang lưu…' : 'Lưu tour'}</button><button type="button" className="button button-secondary" onClick={() => setForm(null)}>Đóng form</button></div>
    </fieldset></form>
    {/* lịch khởi hành chỉ có khi tour đã lưu (đã có id) */}
    {form.id && <section className="admin-departures"><h2>Lịch khởi hành của tour #{form.id}</h2>{departures === null ? <p>Đang tải lịch…</p> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Ngày đi</th><th>Giá/người</th><th>Đã đặt / sức chứa</th><th>Trạng thái</th><th>Sửa</th></tr></thead><tbody>{departures.map(d => <tr key={d.id}><td>{bookingDate(d.start_date)}</td><td>{formatPrice(d.price_per_person)}</td><td>{d.seats_booked} / {d.capacity}</td><td>{departureStatuses[d.status]}</td><td><button className="button button-secondary" onClick={() => setDep(d)}>Sửa lịch #{d.id}</button></td></tr>)}</tbody></table></div>}
      <h3>{dep.id ? `Sửa lịch #${dep.id}` : 'Thêm lịch mới'}</h3><form className="admin-form" onSubmit={submitDeparture}><fieldset disabled={busy}><div className="admin-form-grid"><label>Ngày khởi hành<input required type="date" value={dep.start_date} onChange={e => setDep({ ...dep, start_date: e.target.value })} /></label><label>Giá mỗi người (VND)<input required type="number" min="1" max="999999999999" step="1" value={dep.price_per_person} onChange={e => setDep({ ...dep, price_per_person: e.target.value })} /></label><label>Sức chứa<input required type="number" min="1" max="500" value={dep.capacity} onChange={e => setDep({ ...dep, capacity: e.target.value })} /></label><label>Trạng thái lịch<select value={dep.status} onChange={e => setDep({ ...dep, status: e.target.value })}>{Object.entries(departureStatuses).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label></div><p className="admin-hint">Lịch có chỗ đã đặt không đổi ngày hoặc hủy trực tiếp được. Sức chứa phải đủ cho các đơn đang có.</p><div className="account-actions"><button className="button button-primary">Lưu lịch khởi hành</button>{dep.id && <button type="button" className="button button-secondary" onClick={() => setDep(emptyDeparture)}>Thêm lịch khác</button>}</div></fieldset></form>
      {/* tạo nhiều lịch cách đều nhau, vd mỗi tháng một chuyến */}
      <details className="admin-destination"><summary>Tạo nhiều lịch cùng lúc</summary><form className="admin-form" onSubmit={submitBulk}><fieldset disabled={busy}><div className="admin-form-grid"><label>Ngày đi đầu tiên<input required type="date" value={bulk.start_date} onChange={e => setBulk({ ...bulk, start_date: e.target.value })} /></label><label>Mỗi lịch cách nhau (ngày)<input required type="number" min="1" max="90" value={bulk.every_days} onChange={e => setBulk({ ...bulk, every_days: e.target.value })} /></label><label>Số lịch cần tạo<input required type="number" min="1" max="24" value={bulk.count} onChange={e => setBulk({ ...bulk, count: e.target.value })} /></label><label>Sức chứa mỗi lịch<input required type="number" min="1" max="500" value={bulk.capacity} onChange={e => setBulk({ ...bulk, capacity: e.target.value })} /></label><label>Giá mỗi người (VND)<input required type="number" min="1" max="999999999999" step="1" value={bulk.price_per_person} onChange={e => setBulk({ ...bulk, price_per_person: e.target.value })} /></label></div><p className="admin-hint">Ngày đã có lịch sẽ được giữ nguyên và bỏ qua.</p><button className="button button-primary">Tạo các lịch</button></fieldset></form></details>
    </section>}</section>}
  </main><Footer /></>;
}
