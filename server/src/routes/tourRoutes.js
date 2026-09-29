import { Router } from "express";
import { getTours } from "../controllers/tourController.js";

const router = Router();
router.get("/", getTours);

export default router;