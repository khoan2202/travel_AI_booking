// Trả danh sách tour cho trang chủ và trang danh sách tour.
import pool from "../db/pool.js";

// GET /api/tours: chỉ lấy tour đang bán (active) và còn ít nhất một lịch đi
// trong tương lai còn chỗ. price_from là giá thấp nhất trong các lịch đó.
export async function getTours(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.title,
        t.slug,
        t.description,
        t.duration_days,
        t.departure_location,
        t.image_url,
        t.tags,

        d.name AS destination,
        d.region,

        MIN(td.price_per_person) AS price_from,
        COUNT(td.id)::INTEGER AS available_departures

      FROM tours t
      JOIN destinations d
        ON d.id = t.destination_id
      JOIN tour_departures td
        ON td.tour_id = t.id
      WHERE t.status = 'active'
        AND td.status = 'scheduled'
        AND td.start_date > CURRENT_DATE
        AND td.seats_booked < td.capacity
      GROUP BY t.id, d.id
      ORDER BY t.id DESC
    `);
    res.json({
      message: "Lấy danh sách tour thành công",
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
}