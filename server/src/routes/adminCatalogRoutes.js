import { Router } from 'express';
import pool from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { requireCsrf } from '../middleware/csrf.js';
import { audit, check, date, handle, integer, text } from '../services/adminCommon.js';

const router = Router(); // Được mount sau requireAuth + requireAdmin của adminRoutes.
router.get('/destinations', handle(async (req, res) => {
  res.json({ data: (await pool.query('SELECT * FROM destinations ORDER BY name')).rows });
}));
router.post('/destinations', requireCsrf, handle(async (req, res) => {
  const name = text(req.body?.name, 2, 100, 'Tên điểm đến');
  const slug = text(req.body?.slug, 2, 120, 'Slug');
  const region = text(req.body?.region, 2, 50, 'Khu vực');
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 'Slug dùng chữ thường không dấu, số và dấu gạch ngang.');
  const result = await withTransaction(async (client) => {
    const row = (await client.query('INSERT INTO destinations(name,slug,region) VALUES($1,$2,$3) RETURNING *', [name, slug, region])).rows[0];
    await audit(client, req.user.id, 'destination.create', 'destination', row.id); return row;
  });
  res.status(201).json({ data: result });
}));
router.get('/tours', handle(async (req, res) => {
  const page = req.query.page || '1', q = String(req.query.q || '').trim();
  check(integer(page, 1, 1000000) && q.length <= 100, 'Bộ lọc chưa hợp lệ.');
  const values = [`%${q}%`];
  const [rows, count] = await Promise.all([
    pool.query(`SELECT t.*, d.name AS destination, d.region FROM tours t JOIN destinations d ON d.id=t.destination_id
      WHERE t.title ILIKE $1 OR d.name ILIKE $1 ORDER BY t.id DESC LIMIT 20 OFFSET $2`, [...values, (Number(page) - 1) * 20]),
    pool.query('SELECT COUNT(*)::int AS total FROM tours t JOIN destinations d ON d.id=t.destination_id WHERE t.title ILIKE $1 OR d.name ILIKE $1', values),
  ]);
  res.json({ data: { items: rows.rows, page: Number(page), total_pages: Math.max(1, Math.ceil(count.rows[0].total / 20)), total: count.rows[0].total } });
}));

function tourInput(body) {
  check(body && integer(body.destination_id), 'Chọn một điểm đến.');
  const title = text(body.title, 5, 200, 'Tên tour'), slug = text(body.slug, 2, 220, 'Slug');
  const description = text(body.description, 20, 5000, 'Mô tả');
  const location = text(body.departure_location, 2, 100, 'Nơi xuất phát');
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 'Slug chưa hợp lệ.');
  check(integer(body.duration_days, 1, 60), 'Số ngày từ 1 đến 60.');
  check(['draft', 'active', 'archived'].includes(body.status), 'Trạng thái tour chưa hợp lệ.');
  check(Array.isArray(body.tags) && body.tags.length <= 10 && body.tags.every(t => typeof t === 'string' && t.trim().length > 0 && t.length <= 30), 'Tối đa 10 tags, mỗi tag tối đa 30 ký tự.');
  const image = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  if (image) { let url; try { url = new URL(image); } catch { /* kiểm tra bên dưới */ }
    check(url?.protocol === 'https:' && image.length <= 2000, 'Ảnh cần URL HTTPS hợp lệ hoặc để trống.'); }
  return [Number(body.destination_id), title, slug, description, Number(body.duration_days), location, image || null, [...new Set(body.tags.map(t => t.trim()))], body.status];
}
router.post('/tours', requireCsrf, handle(async (req, res) => {
  const input = tourInput(req.body);
  const result = await withTransaction(async (client) => {
    const row = (await client.query(`INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,image_url,tags,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, input)).rows[0];
    await audit(client, req.user.id, 'tour.create', 'tour', row.id, { status: row.status }); return row;
  }); res.status(201).json({ data: result });
}));
router.post('/tours/:id/update', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.'); const input = tourInput(req.body);
  const result = await withTransaction(async (client) => {
    const row = (await client.query(`UPDATE tours SET destination_id=$1,title=$2,slug=$3,description=$4,duration_days=$5,
      departure_location=$6,image_url=$7,tags=$8,status=$9 WHERE id=$10 RETURNING *`, [...input, req.params.id])).rows[0];
    check(row, 'Không tìm thấy tour.', 404); await audit(client, req.user.id, 'tour.update', 'tour', row.id, { status: row.status }); return row;
  }); res.json({ data: result });
}));
router.get('/tours/:id/departures', handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.');
  res.json({ data: (await pool.query(`SELECT id,tour_id,to_char(start_date,'YYYY-MM-DD') AS start_date,price_per_person,capacity,seats_booked,status
    FROM tour_departures WHERE tour_id=$1 ORDER BY start_date DESC,id DESC`, [req.params.id])).rows });
}));
function departureInput(body) {
  check(body && integer(body.capacity, 1, 500), 'Sức chứa từ 1 đến 500.');
  check(integer(body.price_per_person, 1, 999999999999), 'Đơn giá là số nguyên dương, tối đa 12 chữ số.');
  check(['scheduled', 'cancelled', 'completed'].includes(body.status), 'Trạng thái lịch chưa hợp lệ.');
  return [date(body.start_date), String(body.price_per_person), Number(body.capacity), body.status];
}
router.post('/tours/:id/departures', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.'); const input = departureInput(req.body);
  check(input[3] === 'scheduled', 'Lịch mới cần ở trạng thái nhận đặt.');
  const result = await withTransaction(async (client) => {
    check((await client.query('SELECT id FROM tours WHERE id=$1 FOR KEY SHARE', [req.params.id])).rowCount, 'Không tìm thấy tour.', 404);
    check((await client.query('SELECT $1::date > CURRENT_DATE AS valid', [input[0]])).rows[0].valid, 'Lịch mới phải sau ngày hôm nay.');
    const row = (await client.query(`INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity,status)
      VALUES($1,$2,$3,$4,$5) RETURNING id`, [req.params.id, ...input])).rows[0];
    await audit(client, req.user.id, 'departure.create', 'departure', row.id); return row;
  }); res.status(201).json({ data: result });
}));
router.post('/departures/:id/update', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID lịch chưa hợp lệ.'); const input = departureInput(req.body);
  const result = await withTransaction(async (client) => {
    const current = (await client.query("SELECT *,to_char(start_date,'YYYY-MM-DD') AS date_text FROM tour_departures WHERE id=$1 FOR UPDATE", [req.params.id])).rows[0];
    check(current, 'Không tìm thấy lịch đi.', 404);
    check(input[2] >= current.seats_booked, 'Sức chứa không được nhỏ hơn số chỗ đã đặt.', 409);
    check(!current.seats_booked || input[0] === current.date_text, 'Lịch đang có đơn: không được đổi ngày khởi hành.', 409);
    check(input[3] !== 'cancelled' || current.seats_booked === 0, 'Hãy xử lý các đơn còn hiệu lực trước khi hủy lịch.', 409);
    const future = (await client.query('SELECT $1::date > CURRENT_DATE AS future', [input[0]])).rows[0].future;
    check(input[3] !== 'completed' || !future, 'Chưa đến ngày khởi hành nên chưa thể đánh dấu hoàn tất.');
    check(input[0] === current.date_text || input[3] !== 'scheduled' || future, 'Ngày mới phải sau hôm nay.');
    await client.query('UPDATE tour_departures SET start_date=$1,price_per_person=$2,capacity=$3,status=$4 WHERE id=$5', [...input, req.params.id]);
    await audit(client, req.user.id, 'departure.update', 'departure', current.id, { status: input[3], capacity: input[2] }); return { id: current.id };
  }); res.json({ data: result });
}));
export default router;
