// /api/tours, ai cũng xem được.
import { Router } from "express";
import { getTours } from "../controllers/tourController.js";
import {
  getTourById,
  getTourDepartures,
} from "../controllers/tourDetailController.js";

const router = Router();

router.get("/", getTours);
router.get("/:id/departures", getTourDepartures);
// /:id để cuối cùng kẻo nuốt mất /:id/departures
router.get("/:id", getTourById);

export default router;
