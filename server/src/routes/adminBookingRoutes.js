import { Router } from 'express';
import pool from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { requireCsrf } from '../middleware/csrf.js';
import { bookingColumns } from '../services/bookingService.js';
import { audit, check, handle, integer, text } from '../services/adminCommon.js';
const router = Router();
async function readAdmin(client, id) {
  return (await client.query(`SELECT ${bookingColumns}, b.user_id, u.email AS user_email
    FROM bookings b JOIN tour_departures td ON td.id=b.departure_id JOIN users u ON u.id=b.user_id WHERE b.id=$1`, [id])).rows[0];
}
router.get('/bookings', handle(async(req,res) => {
  const page=req.query.page||'1', status=req.query.status||'', payment=req.query.payment||'', q=String(req.query.q||'').trim();
  check(integer(page,1,1000000) && q.length<=100 && ['','confirmed','cancelled'].includes(status) && ['','unpaid','paid','refunded'].includes(payment),'Bộ lọc đơn chưa hợp lệ.');
  const condition=`WHERE ($1='' OR b.status=$1) AND ($2='' OR b.payment_status=$2)
    AND (b.contact_name ILIKE $3 OR b.contact_email ILIKE $3 OR b.tour_title ILIKE $3 OR ('TM'||lpad(b.id::text,6,'0')) ILIKE $3)`;
  const params=[status,payment,`%${q}%`];
  const [rows,count]=await Promise.all([
    pool.query(`SELECT ${bookingColumns},b.user_id FROM bookings b JOIN tour_departures td ON td.id=b.departure_id ${condition} ORDER BY b.id DESC LIMIT 20 OFFSET $4`,[...params,(Number(page)-1)*20]),
    pool.query(`SELECT COUNT(*)::int AS total FROM bookings b ${condition}`,params),
  ]);
  res.json({data:{items:rows.rows,total:count.rows[0].total,page:Number(page),total_pages:Math.max(1,Math.ceil(count.rows[0].total/20))}});
}));
router.get('/bookings/:id',handle(async(req,res)=>{
  check(integer(req.params.id),'ID đơn chưa hợp lệ.');
  const booking=await readAdmin(pool,req.params.id);check(booking,'Không tìm thấy đơn.',404);
  const [events,logs]=await Promise.all([
    pool.query('SELECT id,kind,amount,reference,note,created_at FROM booking_payment_events WHERE booking_id=$1 ORDER BY id',[req.params.id]),
    pool.query("SELECT action,details,created_at FROM admin_audit_logs WHERE entity_type='booking' AND entity_id=$1 ORDER BY id DESC LIMIT 30",[req.params.id]),
  ]);res.json({data:{booking,events:events.rows,logs:logs.rows}});
}));
router.post('/bookings/:id/action',requireCsrf,handle(async(req,res)=>{
  check(integer(req.params.id),'ID đơn chưa hợp lệ.');
  const action=req.body?.action;check(['mark_paid','cancel_unpaid','refund_cancel'].includes(action),'Thao tác không hợp lệ.');
  check(req.body?.confirmed===true,'Cần xác nhận đã kiểm tra thao tác.');
  const note=text(req.body.note,5,500,'Ghi chú/lý do');
  const reference=action==='cancel_unpaid'?'':text(req.body.reference,4,120,'Mã đối soát');
  const result=await withTransaction(async(client)=>{
    const ref=(await client.query('SELECT departure_id FROM bookings WHERE id=$1',[req.params.id])).rows[0];check(ref,'Không tìm thấy đơn.',404);
    await client.query('SELECT id FROM tour_departures WHERE id=$1 FOR UPDATE',[ref.departure_id]);
    const b=(await client.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];
    if(action==='mark_paid'){
      if(b.status==='confirmed'&&b.payment_status==='paid')return readAdmin(client,b.id);
      check(b.status==='confirmed'&&b.payment_status==='unpaid','Chỉ ghi nhận thanh toán cho đơn còn hiệu lực, chưa thanh toán.',409);
      await client.query("INSERT INTO booking_payment_events(booking_id,actor_id,kind,amount,reference,note) VALUES($1,$2,'payment',$3,$4,$5)",[b.id,req.user.id,b.total_price,reference,note]);
      await client.query("UPDATE bookings SET payment_status='paid' WHERE id=$1",[b.id]);
    }else{
      const targetPayment=action==='refund_cancel'?'refunded':'unpaid';
      if(b.status==='cancelled'&&b.payment_status===targetPayment)return readAdmin(client,b.id);
      check(b.status==='confirmed','Đơn này đã hủy.',409);
      check(b.payment_status===(action==='refund_cancel'?'paid':'unpaid'),'Trạng thái thanh toán đã thay đổi. Tải lại đơn để chọn đúng thao tác.',409);
      if(action==='refund_cancel')await client.query("INSERT INTO booking_payment_events(booking_id,actor_id,kind,amount,reference,note) VALUES($1,$2,'refund',$3,$4,$5)",[b.id,req.user.id,b.total_price,reference,note]);
      const released=await client.query('UPDATE tour_departures SET seats_booked=seats_booked-$1 WHERE id=$2 AND seats_booked>=$1 RETURNING id',[b.guest_count,b.departure_id]);
      check(released.rowCount===1,'Số chỗ không khớp dữ liệu đơn. Cần kiểm tra dữ liệu trước khi hủy.',409);
      await client.query("UPDATE bookings SET status='cancelled',payment_status=$1,cancelled_at=NOW() WHERE id=$2",[targetPayment,b.id]);
    }
    await audit(client,req.user.id,'booking.'+action,'booking',b.id,{reference,note});return readAdmin(client,b.id);
  });res.json({data:result});
}));
export default router;
