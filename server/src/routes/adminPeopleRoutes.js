// Admin: khách hàng, hộp thư hỗ trợ, nhật ký thao tác.
import { Router } from 'express';
import pool from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { requireCsrf } from '../middleware/csrf.js';
import { audit, check, handle, integer } from '../services/adminCommon.js';

const router = Router(); // adminRoutes đã chặn người không phải admin từ trước
const PAGE_SIZE = 20;
const pages = (total) => Math.max(1, Math.ceil(total / PAGE_SIZE));

// GET /users: kèm số đơn và tiền đã trả. Tuyệt đối không trả mật khẩu.
router.get('/users', handle(async (req, res) => {
  const page = req.query.page || '1', role = String(req.query.role || ''), q = String(req.query.q || '').trim();
  check(integer(page, 1, 1000000) && q.length <= 100 && ['', 'user', 'admin'].includes(role), 'Bộ lọc tài khoản chưa hợp lệ.');
  const condition = "WHERE ($1 = '' OR u.role = $1) AND (u.name ILIKE $2 OR u.email ILIKE $2)";
  const params = [role, `%${q}%`];
  const [rows, count] = await Promise.all([
    pool.query(`SELECT u.id, u.name, u.email, u.role, u.created_at,
        COUNT(b.id)::int AS bookings_count,
        COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'confirmed' AND b.payment_status = 'paid'), 0)::text AS paid_total,
        MAX(b.created_at) AS last_booking_at
      FROM users u LEFT JOIN bookings b ON b.user_id = u.id ${condition}
      GROUP BY u.id ORDER BY u.id DESC LIMIT ${PAGE_SIZE} OFFSET $3`, [...params, (Number(page) - 1) * PAGE_SIZE]),
    pool.query(`SELECT COUNT(*)::int AS total FROM users u ${condition}`, params),
  ]);
  res.json({ data: { items: rows.rows, total: count.rows[0].total, page: Number(page), total_pages: pages(count.rows[0].total), me: req.user.id } });
}));

// POST /users/:id/role. Không cho tự đổi quyền của mình, để hệ thống không bị mất hết admin.
router.post('/users/:id/role', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID tài khoản chưa hợp lệ.');
  const role = req.body?.role;
  check(['user', 'admin'].includes(role), 'Quyền chưa hợp lệ.');
  check(Number(req.params.id) !== req.user.id, 'Bạn không thể tự đổi quyền của chính mình.', 409);
  const row = await withTransaction(async (client) => {
    const current = (await client.query('SELECT id, role FROM users WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
    check(current, 'Không tìm thấy tài khoản.', 404);
    if (current.role === role) return current;
    await client.query('UPDATE users SET role = $1 WHERE id = $2', [role, current.id]);
    await audit(client, req.user.id, 'user.role', 'user', current.id, { from: current.role, to: role });
    return { id: current.id, role };
  });
  res.json({ data: row });
}));

// GET /support: thư từ trang Liên hệ
router.get('/support', handle(async (req, res) => {
  const page = req.query.page || '1', status = String(req.query.status || ''), q = String(req.query.q || '').trim();
  check(integer(page, 1, 1000000) && q.length <= 100 && ['', 'pending', 'resolved'].includes(status), 'Bộ lọc yêu cầu chưa hợp lệ.');
  const condition = "WHERE ($1 = '' OR s.status = $1) AND (s.full_name ILIKE $2 OR s.phone ILIKE $2 OR s.message ILIKE $2)";
  const params = [status, `%${q}%`];
  const [rows, count, pending] = await Promise.all([
    pool.query(`SELECT s.id, s.full_name, s.phone, s.message, s.status, s.booking_id, s.created_at, u.email AS user_email
      FROM support_requests s LEFT JOIN users u ON u.id = s.user_id ${condition}
      ORDER BY (s.status = 'pending') DESC, s.id DESC LIMIT ${PAGE_SIZE} OFFSET $3`, [...params, (Number(page) - 1) * PAGE_SIZE]),
    pool.query(`SELECT COUNT(*)::int AS total FROM support_requests s ${condition}`, params),
    pool.query("SELECT COUNT(*)::int AS total FROM support_requests WHERE status = 'pending'"),
  ]);
  res.json({ data: { items: rows.rows, total: count.rows[0].total, page: Number(page), total_pages: pages(count.rows[0].total), pending: pending.rows[0].total } });
}));

// POST /support/:id/status: đánh dấu đã xử lý hoặc mở lại
router.post('/support/:id/status', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID yêu cầu chưa hợp lệ.');
  const status = req.body?.status;
  check(['pending', 'resolved'].includes(status), 'Trạng thái chưa hợp lệ.');
  const row = await withTransaction(async (client) => {
    const updated = (await client.query('UPDATE support_requests SET status = $1 WHERE id = $2 RETURNING id, status', [status, req.params.id])).rows[0];
    check(updated, 'Không tìm thấy yêu cầu.', 404);
    await audit(client, req.user.id, 'support.' + status, 'support', updated.id);
    return updated;
  });
  res.json({ data: row });
}));

// GET /activity: mới nhất trước
router.get('/activity', handle(async (req, res) => {
  const page = req.query.page || '1', type = String(req.query.type || '');
  check(integer(page, 1, 1000000) && ['', 'booking', 'tour', 'departure', 'destination', 'post', 'user', 'support'].includes(type), 'Bộ lọc nhật ký chưa hợp lệ.');
  const condition = "WHERE ($1 = '' OR l.entity_type = $1)";
  const [rows, count] = await Promise.all([
    pool.query(`SELECT l.id, l.action, l.entity_type, l.entity_id, l.details, l.created_at, u.name AS actor_name, u.email AS actor_email
      FROM admin_audit_logs l JOIN users u ON u.id = l.actor_id ${condition}
      ORDER BY l.id DESC LIMIT ${PAGE_SIZE} OFFSET $2`, [type, (Number(page) - 1) * PAGE_SIZE]),
    pool.query(`SELECT COUNT(*)::int AS total FROM admin_audit_logs l ${condition}`, [type]),
  ]);
  res.json({ data: { items: rows.rows, total: count.rows[0].total, page: Number(page), total_pages: pages(count.rows[0].total) } });
}));

export default router;
