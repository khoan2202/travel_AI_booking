import { withTransaction } from '../db/transaction.js';

export class BookingError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const bookingColumns = `
  b.id, b.departure_id, td.tour_id, b.guest_count, b.unit_price, b.total_price,
  b.tour_title, to_char(b.departure_date, 'YYYY-MM-DD') AS departure_date,
  b.contact_name, b.contact_email, b.contact_phone, b.notes,
  b.status, b.payment_status, b.created_at, b.cancelled_at,
  (b.status = 'confirmed' AND b.payment_status = 'unpaid'
    AND b.departure_date > CURRENT_DATE) AS can_cancel
`;

export async function readOwnedBooking(client, id, userId) {
  const result = await client.query(`
    SELECT ${bookingColumns} FROM bookings b
    JOIN tour_departures td ON td.id = b.departure_id
    WHERE b.id = $1 AND b.user_id = $2
  `, [id, userId]);
  return result.rows[0];
}

export function positiveId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= 2147483647 ? number : null;
}

function validate(body) {
  const departureId = Number.isInteger(body?.departure_id) ? positiveId(body.departure_id) : null;
  const guests = body?.guest_count;
  const key = typeof body?.request_key === 'string' ? body.request_key.toLowerCase() : '';
  const name = typeof body?.contact_name === 'string' ? body.contact_name.trim() : '';
  const rawPhone = typeof body?.contact_phone === 'string' ? body.contact_phone : '';
  const phone = rawPhone.replace(/[\s().-]/g, '');
  const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
  const expected = body?.expected_unit_price;
  const validPrice = (typeof expected === 'string' || typeof expected === 'number')
    && /^\d{1,12}$/.test(String(expected)) && Number(expected) > 0;
  if (!departureId || !Number.isInteger(guests) || guests < 1 || guests > 20
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(key)
    || name.length < 2 || name.length > 100 || rawPhone.length > 30
    || !/^\+?\d{9,15}$/.test(phone) || notes.length > 500
    || (body?.notes !== undefined && typeof body.notes !== 'string') || !validPrice) {
    throw new BookingError(400, 'INVALID_BOOKING', 'Kiểm tra lịch đi, số người (1–20), họ tên và số điện thoại (9–15 chữ số).');
  }
  return { departureId, guests, key, name, phone, notes, expected: String(Number(expected)) };
}

export async function createBooking(user, body) {
  const input = validate(body);
  return withTransaction(async (client) => {
    // Khóa theo người dùng: hai lần gửi cùng mã yêu cầu phải được xét lần lượt.
    await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [user.id]);
    const previous = (await client.query(
      'SELECT * FROM bookings WHERE user_id = $1 AND request_key = $2', [user.id, input.key]
    )).rows[0];
    if (previous) {
      if (previous.departure_id !== input.departureId || previous.guest_count !== input.guests
        || previous.contact_name !== input.name || previous.contact_phone !== input.phone
        || previous.notes !== input.notes || previous.unit_price !== input.expected) {
        throw new BookingError(409, 'REQUEST_CHANGED', 'Yêu cầu này đã được dùng cho một đơn khác. Hãy kiểm tra Đơn của tôi.');
      }
      return { booking: await readOwnedBooking(client, previous.id, user.id), replayed: true };
    }

    // FOR UPDATE giữ khóa đến COMMIT/ROLLBACK; yêu cầu khác phải chờ rồi đọc số chỗ mới.
    const departure = (await client.query(`
      SELECT td.*, to_char(td.start_date, 'YYYY-MM-DD') AS snapshot_date, t.title, t.status AS tour_status,
        (td.start_date > CURRENT_DATE) AS is_future
      FROM tour_departures td JOIN tours t ON t.id = td.tour_id
      WHERE td.id = $1 FOR UPDATE OF td, t
    `, [input.departureId])).rows[0];
    if (!departure) throw new BookingError(404, 'NOT_FOUND', 'Không tìm thấy lịch khởi hành.');
    if (departure.tour_status !== 'active' || departure.status !== 'scheduled' || !departure.is_future) {
      throw new BookingError(409, 'DEPARTURE_CLOSED', 'Lịch khởi hành này không còn nhận đặt tour.');
    }
    if (departure.capacity - departure.seats_booked < input.guests) {
      throw new BookingError(409, 'INSUFFICIENT_SEATS', 'Lịch này không còn đủ chỗ. Hãy chọn lại lịch hoặc giảm số người.');
    }
    if (departure.price_per_person !== input.expected) {
      throw new BookingError(409, 'PRICE_CHANGED', 'Giá tour vừa thay đổi. Hãy cập nhật giá và xem lại trước khi xác nhận.');
    }

    await client.query('UPDATE tour_departures SET seats_booked = seats_booked + $1 WHERE id = $2', [input.guests, input.departureId]);
    // Giá được đọc từ DB. Bỏ qua user_id, role, total_price do trình duyệt gửi lên.
    const inserted = await client.query(`
      INSERT INTO bookings (user_id, departure_id, request_key, guest_count, unit_price,
        total_price, tour_title, departure_date, contact_name, contact_email, contact_phone, notes)
      VALUES ($1, $2, $3, $4, $5, $5::numeric * $4::integer, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [user.id, input.departureId, input.key, input.guests, departure.price_per_person,
      departure.title, departure.snapshot_date, input.name, user.email, input.phone, input.notes]);
    return { booking: await readOwnedBooking(client, inserted.rows[0].id, user.id), replayed: false };
  });
}

export async function cancelBooking(userId, id) {
  return withTransaction(async (client) => {
    const ref = (await client.query('SELECT departure_id FROM bookings WHERE id = $1 AND user_id = $2', [id, userId])).rows[0];
    if (!ref) throw new BookingError(404, 'NOT_FOUND', 'Không tìm thấy đơn đặt tour của bạn.');
    // Thống nhất thứ tự khóa lịch trước, đơn sau; hai lần hủy không trả chỗ hai lần.
    await client.query('SELECT id FROM tour_departures WHERE id = $1 FOR UPDATE', [ref.departure_id]);
    const booking = (await client.query(`
      SELECT *, (departure_date > CURRENT_DATE) AS is_future FROM bookings
      WHERE id = $1 AND user_id = $2 FOR UPDATE
    `, [id, userId])).rows[0];
    if (booking.status === 'cancelled') return { booking: await readOwnedBooking(client, id, userId), replayed: true };
    if (booking.payment_status !== 'unpaid' || !booking.is_future) {
      throw new BookingError(409, 'CANNOT_CANCEL', 'Chỉ hủy trực tuyến đơn chưa thanh toán và chưa đến ngày khởi hành.');
    }
    const released = await client.query(`
      UPDATE tour_departures SET seats_booked = seats_booked - $1
      WHERE id = $2 AND seats_booked >= $1 RETURNING id
    `, [booking.guest_count, booking.departure_id]);
    if (released.rowCount !== 1) throw new Error('BOOKING_SEAT_INCONSISTENCY');
    await client.query("UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE id = $1", [id]);
    return { booking: await readOwnedBooking(client, id, userId), replayed: false };
  });
}
