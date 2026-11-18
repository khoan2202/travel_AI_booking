// Danh sách đơn cho admin: lọc theo từ khóa, trạng thái, thanh toán, và xuất CSV.
// Bộ lọc đầu tiên có thể đến từ URL, vd /admin/bookings?payment=unpaid bấm từ Dashboard.
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import AdminNav from '../components/AdminNav.jsx';
import { exportAdminBookings, getAdminBookings } from '../services/adminApi.js';
import { bookingCode, bookingDate, bookingStatus, paymentStatus } from '../utils/booking.js';
import { formatPrice } from '../utils/format.js';
import { formatDateTime } from '../utils/blog.js';
import { downloadCsv } from '../utils/csv.js';
import useLoad from '../hooks/useLoad.js';
export default function AdminBookingsPage(){
  const [params]=useSearchParams();
  const start={q:params.get('q')||'',status:params.get('status')||'',payment:params.get('payment')||''};
  // draft là chữ đang gõ, filters mới là bộ lọc đang áp dụng (sau khi bấm "Lọc đơn")
  const [filters,setFilters]=useState({page:1,...start}),[draft,setDraft]=useState(start);
  const [retry,setRetry]=useState(0);
  const [exporting,setExporting]=useState(false),[exportError,setExportError]=useState('');
  // đổi bộ lọc, đổi trang hay bấm thử lại đều tải lại
  const load=useCallback((signal)=>getAdminBookings(filters,signal),[filters]);
  const {data,error,loading}=useLoad(load,retry);
  // xuất mọi đơn khớp bộ lọc ra CSV, mở được bằng Excel
  async function exportCsv(){
    setExporting(true);setExportError('');
    try{
      const {q,status,payment}=filters;
      const rows=await exportAdminBookings({q,status,payment});
      downloadCsv(`travel-mint-don-dat-${new Date().toISOString().slice(0,10)}.csv`,[
        ['Mã đơn','Khách','Email','Điện thoại','Tour','Ngày đi','Số khách','Tổng tiền (VND)','Trạng thái','Thanh toán','Ngày đặt'],
        ...rows.map(b=>[bookingCode(b.id),b.contact_name,b.contact_email,b.contact_phone,b.tour_title,bookingDate(b.departure_date),b.guest_count,b.total_price,bookingStatus(b.status),paymentStatus(b.payment_status),formatDateTime(b.created_at)]),
      ]);
    }catch(e){setExportError(e.message);}finally{setExporting(false);}
  }
  return <><Header/><main className="container admin-page"><AdminNav/><p className="section-kicker">VẬN HÀNH TOUR</p><h1>Đơn đặt & thanh toán</h1><p className="account-intro">Theo dõi đơn, ghi nhận thanh toán và xử lý hủy/hoàn tiền thủ công.</p>
    {exportError&&<p className="auth-error" role="alert">{exportError}</p>}
    <div className="admin-toolbar"><form onSubmit={e=>{e.preventDefault();setFilters({...draft,page:1});}}><input aria-label="Tìm đơn" value={draft.q} maxLength="100" placeholder="Mã đơn, tên, email hoặc tour" onChange={e=>setDraft({...draft,q:e.target.value})}/><select aria-label="Trạng thái đơn" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}><option value="">Tất cả đơn</option><option value="confirmed">Còn hiệu lực</option><option value="cancelled">Đã hủy</option></select><select aria-label="Thanh toán" value={draft.payment} onChange={e=>setDraft({...draft,payment:e.target.value})}><option value="">Tất cả thanh toán</option><option value="unpaid">Chưa thanh toán</option><option value="paid">Đã thanh toán</option><option value="refunded">Đã hoàn tiền</option></select><button className="button button-primary">Lọc đơn</button></form><button className="button button-secondary" type="button" disabled={exporting||!data?.total} onClick={exportCsv}>{exporting?'Đang xuất…':'Xuất file CSV'}</button></div>
    {error?<div className="state-box"><p role="alert">{error}</p><button className="button button-secondary" onClick={()=>setRetry(n=>n+1)}>Thử lại</button></div>:!data?<p role="status">Đang tải đơn…</p>:<><div className={loading?'admin-table-wrap is-loading':'admin-table-wrap'}><table className="admin-table"><caption>{data.total} đơn phù hợp</caption><thead><tr><th>Đơn / Khách</th><th>Hành trình</th><th>Tổng tiền</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>{data.items.map(b=><tr key={b.id}><td>{bookingCode(b.id)}<small>{b.contact_name}<br/>{b.contact_email}</small></td><td>{b.tour_title}<small>{bookingDate(b.departure_date)} · {b.guest_count} người</small></td><td>{formatPrice(b.total_price)}</td><td>{bookingStatus(b.status)}<small>{paymentStatus(b.payment_status)}</small></td><td><Link className="button button-secondary" to={`/admin/bookings/${b.id}`}>Mở {bookingCode(b.id)}</Link></td></tr>)}</tbody></table></div><div className="booking-pagination"><button className="button button-secondary" disabled={filters.page<=1} onClick={()=>setFilters({...filters,page:filters.page-1})}>Trang trước</button><span>{data.page} / {data.total_pages}</span><button className="button button-secondary" disabled={filters.page>=data.total_pages} onClick={()=>setFilters({...filters,page:filters.page+1})}>Trang sau</button></div></>}
  </main><Footer/></>;
}
