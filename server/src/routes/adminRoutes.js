// Cổng vào mọi API quản trị: /api/admin/... Chỉ admin mới gọi được.
import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import catalogRoutes from "./adminCatalogRoutes.js";
import adminBookingRoutes from "./adminBookingRoutes.js";

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

export default router;
