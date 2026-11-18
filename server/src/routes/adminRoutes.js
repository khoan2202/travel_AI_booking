// Cổng vào mọi API quản trị: /api/admin/... Chỉ admin mới gọi được.
import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import catalogRoutes from "./adminCatalogRoutes.js";
import adminBookingRoutes from "./adminBookingRoutes.js";
import adminBlogRoutes from "./adminBlogRoutes.js";
import adminPeopleRoutes from "./adminPeopleRoutes.js";
import { handle } from "../services/adminCommon.js";

const router = Router();
// Không cho cache dữ liệu quản trị.
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
// Áp dụng cho toàn bộ route admin: phải đăng nhập VÀ có role = 'admin'.
router.use(requireAuth, requireAdmin);
// Gộp thêm route quản lý tour/điểm đến và route quản lý đơn.
router.use(catalogRoutes);
router.use(adminBookingRoutes);
// Bài viết blog; khách hàng, hỗ trợ và nhật ký.
router.use(adminBlogRoutes);
router.use(adminPeopleRoutes);

// GET /api/admin/overview: các con số tổng quan cho trang Dashboard.
router.get("/overview", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::INTEGER FROM users) AS users_count,
        (SELECT COUNT(*)::INTEGER FROM tours WHERE status = 'active') AS active_tours_count,
        (SELECT COUNT(*)::INTEGER
         FROM tour_departures td JOIN tours t ON t.id = td.tour_id
         WHERE t.status = 'active' AND td.status = 'scheduled'
           AND td.start_date > CURRENT_DATE AND td.seats_booked < td.capacity
        ) AS available_departures_count,
        (SELECT COUNT(*)::integer FROM bookings WHERE status='confirmed') AS confirmed_bookings_count,
        (SELECT COUNT(*)::integer FROM bookings WHERE status='cancelled') AS cancelled_bookings_count,
        (SELECT COALESCE(SUM(total_price),0)::text FROM bookings WHERE status='confirmed' AND payment_status='paid') AS received_amount
    `);
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/insights: số liệu phân tích cho Dashboard (doanh thu, việc cần làm, tour bán chạy).
// Tính theo giờ Việt Nam để khoản thu cuối tháng không bị nhảy sang tháng khác.
router.get("/insights", handle(async (req, res) => {
  const vnMonth = (column) => `date_trunc('month', ${column} AT TIME ZONE 'Asia/Ho_Chi_Minh')`;
  // Bảng hỗ trợ và blog có thể chưa có trên database cũ, nên kiểm tra trước khi đọc.
  const tables = (await pool.query("SELECT to_regclass('public.support_requests') AS support, to_regclass('public.blog_posts') AS blog")).rows[0];
  const [months, todo, lowTours, topTours, recent, support, blog] = await Promise.all([
    // 6 tháng gần nhất, tháng chưa có giao dịch vẫn hiện với số 0.
    pool.query(`WITH months AS (
        SELECT generate_series(${vnMonth("NOW()")} - INTERVAL '5 months', ${vnMonth("NOW()")}, INTERVAL '1 month') AS m
      )
      SELECT to_char(m, 'YYYY-MM') AS month,
        COALESCE((SELECT SUM(e.amount) FROM booking_payment_events e WHERE e.kind = 'payment' AND ${vnMonth("e.created_at")} = m), 0)::text AS received,
        COALESCE((SELECT SUM(e.amount) FROM booking_payment_events e WHERE e.kind = 'refund' AND ${vnMonth("e.created_at")} = m), 0)::text AS refunded,
        (SELECT COUNT(*)::int FROM bookings b WHERE ${vnMonth("b.created_at")} = m) AS bookings
      FROM months ORDER BY m`),
    pool.query(`SELECT
        (SELECT COUNT(*)::int FROM bookings WHERE status = 'confirmed' AND payment_status = 'unpaid') AS unpaid_bookings,
        (SELECT COUNT(*)::int FROM bookings WHERE status = 'confirmed' AND payment_status = 'unpaid'
          AND departure_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7) AS unpaid_departing_soon,
        (SELECT COUNT(*)::int FROM tour_departures td JOIN tours t ON t.id = td.tour_id
          WHERE t.status = 'active' AND td.status = 'scheduled' AND td.start_date > CURRENT_DATE
            AND td.seats_booked < td.capacity AND td.seats_booked >= td.capacity * 0.8) AS almost_full_departures`),
    // Tour đang bán nhưng còn dưới 2 lịch tương lai: sắp biến mất khỏi trang chủ.
    pool.query(`SELECT t.id, t.title, COUNT(td.id)::int AS upcoming, to_char(MAX(td.start_date), 'YYYY-MM-DD') AS last_date
      FROM tours t LEFT JOIN tour_departures td ON td.tour_id = t.id AND td.status = 'scheduled' AND td.start_date > CURRENT_DATE
      WHERE t.status = 'active' GROUP BY t.id HAVING COUNT(td.id) < 2 ORDER BY COUNT(td.id), t.id DESC LIMIT 5`),
    pool.query(`SELECT t.id, t.title, SUM(b.guest_count)::int AS guests, COUNT(b.id)::int AS bookings, SUM(b.total_price)::text AS revenue
      FROM bookings b JOIN tour_departures td ON td.id = b.departure_id JOIN tours t ON t.id = td.tour_id
      WHERE b.status = 'confirmed' GROUP BY t.id ORDER BY SUM(b.total_price) DESC LIMIT 5`),
    pool.query(`SELECT id, contact_name, tour_title, total_price, status, payment_status, created_at FROM bookings ORDER BY id DESC LIMIT 5`),
    tables.support ? pool.query("SELECT COUNT(*)::int AS pending FROM support_requests WHERE status = 'pending'") : null,
    tables.blog ? pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'draft')::int AS drafts,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published, COALESCE(SUM(view_count), 0)::int AS views FROM blog_posts`) : null,
  ]);
  res.json({ data: {
    months: months.rows, todo: todo.rows[0], low_tours: lowTours.rows, top_tours: topTours.rows, recent_bookings: recent.rows,
    support_pending: support ? support.rows[0].pending : null,
    blog: blog ? blog.rows[0] : null,
  } });
}));

export default router;
