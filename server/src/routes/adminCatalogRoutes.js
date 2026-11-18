// Admin quản lý điểm đến, tour và lịch khởi hành. Mỗi thao tác ghi chạy trong transaction và vào nhật ký.
import { Router } from 'express';
import pool from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { requireCsrf } from '../middleware/csrf.js';
import { audit, check, date, handle, integer, text } from '../services/adminCommon.js';

const router = Router(); // adminRoutes đã chặn người không phải admin từ trước
// GET /destinations
router.get('/destinations', handle(async (req, res) => {
  res.json({ data: (await pool.query('SELECT * FROM destinations ORDER BY name')).rows });
}));
// POST /destinations
router.post('/destinations', requireCsrf, handle(async (req, res) => {
  const name = text(req.body?.name, 2, 100, 'Tên điểm đến');
  const slug = text(req.body?.slug, 2, 120, 'Slug');
  const region = text(req.body?.region, 2, 50, 'Khu vực');
  // slug dùng trên URL, vd "da-lat"
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 'Slug dùng chữ thường không dấu, số và dấu gạch ngang.');
  const result = await withTransaction(async (client) => {
    const row = (await client.query('INSERT INTO destinations(name,slug,region) VALUES($1,$2,$3) RETURNING *', [name, slug, region])).rows[0];
    await audit(client, req.user.id, 'destination.create', 'destination', row.id); return row;
  });
  res.status(201).json({ data: result });
}));
// GET /tours: tìm kiếm, lọc trạng thái, 20 tour một trang.
// upcoming_departures và next_departure để cảnh báo tour sắp hết lịch.
router.get('/tours', handle(async (req, res) => {
  const page = req.query.page || '1', q = String(req.query.q || '').trim(), status = String(req.query.status || '');
  check(integer(page, 1, 1000000) && q.length <= 100 && ['', 'draft', 'active', 'archived'].includes(status), 'Bộ lọc chưa hợp lệ.');
  const values = [`%${q}%`, status];
  const condition = "(t.title ILIKE $1 OR d.name ILIKE $1) AND ($2 = '' OR t.status = $2)";
  const [rows, count] = await Promise.all([
    pool.query(`SELECT t.*, d.name AS destination, d.region,
        (SELECT COUNT(*)::int FROM tour_departures td WHERE td.tour_id=t.id AND td.status='scheduled' AND td.start_date>CURRENT_DATE) AS upcoming_departures,
        (SELECT to_char(MIN(td.start_date),'YYYY-MM-DD') FROM tour_departures td WHERE td.tour_id=t.id AND td.status='scheduled' AND td.start_date>CURRENT_DATE) AS next_departure
      FROM tours t JOIN destinations d ON d.id=t.destination_id
      WHERE ${condition} ORDER BY t.id DESC LIMIT 20 OFFSET $3`, [...values, (Number(page) - 1) * 20]),
    pool.query(`SELECT COUNT(*)::int AS total FROM tours t JOIN destinations d ON d.id=t.destination_id WHERE ${condition}`, values),
  ]);
  res.json({ data: { items: rows.rows, page: Number(page), total_pages: Math.max(1, Math.ceil(count.rows[0].total / 20)), total: count.rows[0].total } });
}));

// kiểm tra dữ liệu tour, trả mảng đúng thứ tự $1..$9 của câu SQL
function tourInput(body) {
  check(body && integer(body.destination_id), 'Chọn một điểm đến.');
  const title = text(body.title, 5, 200, 'Tên tour'), slug = text(body.slug, 2, 220, 'Slug');
  const description = text(body.description, 20, 5000, 'Mô tả');
  const location = text(body.departure_location, 2, 100, 'Nơi xuất phát');
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 'Slug chưa hợp lệ.');
  check(integer(body.duration_days, 1, 60), 'Số ngày từ 1 đến 60.');
  check(['draft', 'active', 'archived'].includes(body.status), 'Trạng thái tour chưa hợp lệ.');
  check(Array.isArray(body.tags) && body.tags.length <= 10 && body.tags.every(t => typeof t === 'string' && t.trim().length > 0 && t.length <= 30), 'Tối đa 10 tags, mỗi tag tối đa 30 ký tự.');
  // ảnh có thể trống, có thì phải là https
  const image = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  if (image) { let url; try { url = new URL(image); } catch { /* kiểm tra bên dưới */ }
    check(url?.protocol === 'https:' && image.length <= 2000, 'Ảnh cần URL HTTPS hợp lệ hoặc để trống.'); }
  // Set để bỏ tag trùng
  return [Number(body.destination_id), title, slug, description, Number(body.duration_days), location, image || null, [...new Set(body.tags.map(t => t.trim()))], body.status];
}
// POST /tours
router.post('/tours', requireCsrf, handle(async (req, res) => {
  const input = tourInput(req.body);
  const result = await withTransaction(async (client) => {
    const row = (await client.query(`INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,image_url,tags,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, input)).rows[0];
    await audit(client, req.user.id, 'tour.create', 'tour', row.id, { status: row.status }); return row;
  }); res.status(201).json({ data: result });
}));
// POST /tours/:id/update
router.post('/tours/:id/update', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.'); const input = tourInput(req.body);
  const result = await withTransaction(async (client) => {
    const row = (await client.query(`UPDATE tours SET destination_id=$1,title=$2,slug=$3,description=$4,duration_days=$5,
      departure_location=$6,image_url=$7,tags=$8,status=$9 WHERE id=$10 RETURNING *`, [...input, req.params.id])).rows[0];
    check(row, 'Không tìm thấy tour.', 404); await audit(client, req.user.id, 'tour.update', 'tour', row.id, { status: row.status }); return row;
  }); res.json({ data: result });
}));
// POST /tours/:id/status: đổi nhanh trạng thái ngay trên bảng
router.post('/tours/:id/status', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.');
  check(['draft', 'active', 'archived'].includes(req.body?.status), 'Trạng thái tour chưa hợp lệ.');
  const result = await withTransaction(async (client) => {
    const row = (await client.query('UPDATE tours SET status=$1 WHERE id=$2 RETURNING id,status', [req.body.status, req.params.id])).rows[0];
    check(row, 'Không tìm thấy tour.', 404);
    await audit(client, req.user.id, 'tour.status', 'tour', row.id, { status: row.status }); return row;
  }); res.json({ data: result });
}));
// POST /tours/:id/duplicate: tạo bản nháp, không chép lịch khởi hành
router.post('/tours/:id/duplicate', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.');
  const result = await withTransaction(async (client) => {
    const source = (await client.query('SELECT * FROM tours WHERE id=$1', [req.params.id])).rows[0];
    check(source, 'Không tìm thấy tour.', 404);
    // gắn thêm chuỗi thời gian để slug không trùng bản sao trước
    const slug = `${source.slug.slice(0, 200)}-ban-sao-${Date.now().toString(36)}`;
    const title = `${source.title.slice(0, 188)} (Bản sao)`;
    const row = (await client.query(`INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,image_url,tags,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,'draft') RETURNING *`, [source.destination_id, title, slug, source.description, source.duration_days, source.departure_location, source.image_url, source.tags])).rows[0];
    await audit(client, req.user.id, 'tour.duplicate', 'tour', row.id, { from: source.id }); return row;
  }); res.status(201).json({ data: result });
}));
// POST /tours/:id/departures/bulk: tạo nhiều lịch cách đều nhau, ngày nào đã có thì bỏ qua
router.post('/tours/:id/departures/bulk', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.');
  const input = departureInput({ ...req.body, status: 'scheduled' });
  check(integer(req.body?.every_days, 1, 90), 'Khoảng cách giữa các lịch từ 1 đến 90 ngày.');
  check(integer(req.body?.count, 1, 24), 'Số lịch tạo một lần từ 1 đến 24.');
  const count = Number(req.body.count), every = Number(req.body.every_days);
  const result = await withTransaction(async (client) => {
    check((await client.query('SELECT id FROM tours WHERE id=$1 FOR KEY SHARE', [req.params.id])).rowCount, 'Không tìm thấy tour.', 404);
    check((await client.query('SELECT $1::date > CURRENT_DATE AS valid', [input[0]])).rows[0].valid, 'Ngày bắt đầu phải sau hôm nay.');
    const rows = await client.query(`INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity,status)
      SELECT $1::int, $2::date + (n * $3::int), $4::numeric, $5::int, 'scheduled' FROM generate_series(0, $6::int - 1) AS n
      ON CONFLICT (tour_id,start_date) DO NOTHING RETURNING id`, [req.params.id, input[0], every, input[1], input[2], count]);
    await audit(client, req.user.id, 'departure.bulk', 'tour', Number(req.params.id), { created: rows.rowCount, skipped: count - rows.rowCount });
    return { created: rows.rowCount, skipped: count - rows.rowCount };
  }); res.status(201).json({ data: result });
}));
// GET /tours/:id/departures: tất cả lịch, kể cả cũ và đã hủy
router.get('/tours/:id/departures', handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.');
  res.json({ data: (await pool.query(`SELECT id,tour_id,to_char(start_date,'YYYY-MM-DD') AS start_date,price_per_person,capacity,seats_booked,status
    FROM tour_departures WHERE tour_id=$1 ORDER BY start_date DESC,id DESC`, [req.params.id])).rows });
}));
// kiểm tra dữ liệu lịch khởi hành
function departureInput(body) {
  check(body && integer(body.capacity, 1, 500), 'Sức chứa từ 1 đến 500.');
  check(integer(body.price_per_person, 1, 999999999999), 'Đơn giá là số nguyên dương, tối đa 12 chữ số.');
  check(['scheduled', 'cancelled', 'completed'].includes(body.status), 'Trạng thái lịch chưa hợp lệ.');
  return [date(body.start_date), String(body.price_per_person), Number(body.capacity), body.status];
}
// POST /tours/:id/departures: ngày đi phải sau hôm nay
router.post('/tours/:id/departures', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID tour chưa hợp lệ.'); const input = departureInput(req.body);
  check(input[3] === 'scheduled', 'Lịch mới cần ở trạng thái nhận đặt.');
  const result = await withTransaction(async (client) => {
    // khóa nhẹ để tour không bị xóa giữa chừng
    check((await client.query('SELECT id FROM tours WHERE id=$1 FOR KEY SHARE', [req.params.id])).rowCount, 'Không tìm thấy tour.', 404);
    check((await client.query('SELECT $1::date > CURRENT_DATE AS valid', [input[0]])).rows[0].valid, 'Lịch mới phải sau ngày hôm nay.');
    const row = (await client.query(`INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity,status)
      VALUES($1,$2,$3,$4,$5) RETURNING id`, [req.params.id, ...input])).rows[0];
    await audit(client, req.user.id, 'departure.create', 'departure', row.id); return row;
  }); res.status(201).json({ data: result });
}));
// POST /departures/:id/update. Mấy ràng buộc: sức chứa không thấp hơn số chỗ đã đặt,
// lịch đã có đơn thì không đổi ngày hay hủy, chưa tới ngày đi thì chưa được đánh dấu hoàn tất.
router.post('/departures/:id/update', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID lịch chưa hợp lệ.'); const input = departureInput(req.body);
  const result = await withTransaction(async (client) => {
    // khóa dòng này để hai admin không sửa cùng lúc
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
