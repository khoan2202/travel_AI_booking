// Chi tiết một tour và các lịch khởi hành của nó.
import pool from '../db/pool.js';

// id là INTEGER của Postgres nên tối đa 2147483647
function parseTourId(value) {
  if (!/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

// GET /api/tours/:id
export async function getTourById(req, res, next) {
  const id = parseTourId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: 'Mã tour không hợp lệ.' });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        t.id, t.title, t.slug, t.description, t.duration_days,
        t.departure_location, t.image_url, t.tags,
        d.name AS destination, d.region,
        (
          SELECT MIN(td.price_per_person)
          FROM tour_departures td
          WHERE td.tour_id = t.id
            AND td.status = 'scheduled'
            AND td.start_date > CURRENT_DATE
            AND td.seats_booked < td.capacity
        ) AS price_from
      FROM tours t
      JOIN destinations d ON d.id = t.destination_id
      WHERE t.id = $1 AND t.status = 'active'
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tour đang mở bán.' });
    }

    res.set('Cache-Control', 'no-store');
    res.json({ message: 'Lấy thông tin tour thành công', data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

// GET /api/tours/:id/departures: lịch còn nhận đặt kèm số chỗ trống
export async function getTourDepartures(req, res, next) {
  const id = parseTourId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: 'Mã tour không hợp lệ.' });
  }

  try {
    // tour không tồn tại khác với tour có nhưng chưa có lịch
    const tour = await pool.query("SELECT id FROM tours WHERE id = $1 AND status = 'active'", [id]);
    if (tour.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tour đang mở bán.' });
    }

    const result = await pool.query(
      `
      SELECT
        td.id,
        td.tour_id,
        TO_CHAR(td.start_date, 'YYYY-MM-DD') AS start_date,
        td.price_per_person,
        (td.capacity - td.seats_booked) AS available_seats
      FROM tour_departures td
      JOIN tours t ON t.id = td.tour_id
      WHERE td.tour_id = $1
        AND t.status = 'active'
        AND td.status = 'scheduled'
        AND td.start_date > CURRENT_DATE
        AND td.seats_booked < td.capacity
      ORDER BY td.start_date ASC, td.id ASC
    `,
      [id],
    );

    // giá và chỗ đổi liên tục nên không cho cache
    res.set('Cache-Control', 'no-store');
    res.json({
      message: 'Lấy lịch khởi hành thành công',
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}
