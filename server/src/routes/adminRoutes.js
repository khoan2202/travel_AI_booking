import { Router } from "express";
import pool from "../db/pool.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import catalogRoutes from "./adminCatalogRoutes.js";

const router = Router();
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.use(requireAuth, requireAdmin);
router.use(catalogRoutes);

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
        ) AS available_departures_count
    `);
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
