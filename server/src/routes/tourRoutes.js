// API xem tour công khai (không cần đăng nhập). Gắn tại /api/tours.
import { Router } from "express";
import { getTours } from "../controllers/tourController.js";
import {
  getTourById,
  getTourDepartures,
} from "../controllers/tourDetailController.js";

const router = Router();

// GET /api/tours: danh sách tour (có lọc, phân trang).
router.get("/", getTours);
// GET /api/tours/:id/departures: các lịch khởi hành còn nhận đặt của một tour.
router.get("/:id/departures", getTourDepartures);
// GET /api/tours/:id: chi tiết một tour.
// Route /:id đặt sau cùng để không "nuốt" mất đường dẫn /:id/departures.
router.get("/:id", getTourById);

export default router;
