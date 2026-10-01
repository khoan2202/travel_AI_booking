import { Router } from "express";
import { getTours } from "../controllers/tourController.js";
import {
  getTourById,
  getTourDepartures,
} from "../controllers/tourDetailController.js";

const router = Router();

router.get("/", getTours);
router.get("/:id/departures", getTourDepartures);
router.get("/:id", getTourById);

export default router;
