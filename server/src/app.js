import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./db/pool.js";
import { createSessionMiddleware } from "./config/session.js";
import tourRoutes from "./routes/tourRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.locals.clientOrigin = new URL(process.env.CLIENT_URL || "http://localhost:5173").origin;
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

  app.use(cors({ origin: app.locals.clientOrigin, credentials: true }));
  app.use(express.json({ limit: "16kb" }));
  const { middleware, store } = createSessionMiddleware();
  app.locals.sessionStore = store;
  app.use(middleware);

  app.get("/api/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ message: "Backend đang chạy", database: "PostgreSQL đã kết nối" });
    } catch (error) {
      console.error("Lỗi kiểm tra database:", error.code);
      res.status(503).json({ message: "Chưa kết nối được PostgreSQL" });
    }
  });

  app.use("/api/tours", tourRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/bookings", bookingRoutes);

  app.use((req, res) => res.status(404).json({ message: "Đường dẫn API không tồn tại" }));
  app.use((error, req, res, next) => {
    console.error("Lỗi xử lý API:", error.code || error.name);
    const status = [400, 413].includes(error.status) ? error.status : 500;
    res.status(status).json({ message: status === 500 ? "Có lỗi phía máy chủ. Vui lòng thử lại." : "Nội dung yêu cầu không hợp lệ hoặc quá lớn." });
  });
  return app;
}
