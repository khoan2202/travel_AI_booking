import pool from '../db/pool.js';
import { BookingError, bookingColumns, positiveId, readOwnedBooking, createBooking, cancelBooking } from '../services/bookingService.js';

function failure(error, res, next) {
  if (error instanceof BookingError) return res.status(error.status).json({ message: error.message, code: error.code });
  if (['55P03', '57014', '40P01'].includes(error.code)) {
    return res.status(503).json({ message: 'Hệ thống đang bận. Vui lòng thử lại yêu cầu này.', code: 'RETRY_BOOKING' });
  }
  next(error);
}

export async function create(req, res, next) {
  try {
    const result = await createBooking(req.user, req.body);
    res.status(result.replayed ? 200 : 201).json({ data: result });
  } catch (error) { failure(error, res, next); }
}

export async function listMine(req, res, next) {
  const page = req.query.page === undefined ? 1 : positiveId(req.query.page);
  if (!page || page > 1000000) return res.status(400).json({ message: 'Số trang không hợp lệ.' });
  const pageSize = 10;
  try {
    const [rows, count] = await Promise.all([
      pool.query(`SELECT ${bookingColumns} FROM bookings b
        JOIN tour_departures td ON td.id = b.departure_id
        WHERE b.user_id = $1 ORDER BY b.created_at DESC, b.id DESC LIMIT $2 OFFSET $3`,
      [req.user.id, pageSize, (page - 1) * pageSize]),
      pool.query('SELECT COUNT(*)::integer AS total FROM bookings WHERE user_id = $1', [req.user.id]),
    ]);
    const total = count.rows[0].total;
    res.json({ data: { items: rows.rows, page, page_size: pageSize, total, total_pages: Math.max(1, Math.ceil(total / pageSize)) } });
  } catch (error) { next(error); }
}

export async function detail(req, res, next) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Mã đơn không hợp lệ.' });
  try {
    const booking = await readOwnedBooking(pool, id, req.user.id);
    if (!booking) return res.status(404).json({ message: 'Không tìm thấy đơn đặt tour của bạn.' });
    res.json({ data: booking });
  } catch (error) { next(error); }
}

export async function cancel(req, res, next) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Mã đơn không hợp lệ.' });
  try { res.json({ data: await cancelBooking(req.user.id, id) }); }
  catch (error) { failure(error, res, next); }
}
