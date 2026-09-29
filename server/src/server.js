import "dotenv/config";
import express from "express";
import cors from "cors";

import pool from "./db/pool.js";
import tourRoutes from "./routes/tourRoutes.js";

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);
app.use(express.json());
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      message: "Backend đang chạy",
      database: "PostgreSQL đã kết nối",
    });
  } catch (error) {
    console.error("Lỗi kiểm tra database:", error.code);
    res.status(503).json({
      message: "Chưa kết nối được PostgreSQL",
    });
  }
});
app.use("/api/tours", tourRoutes);
app.use((req, res) => {
  res.status(404).json({
    message: "Đường dẫn API không tồn tại",
  });
});
app.use((error, req, res, next) => {
  console.error("Lỗi xử lý API:", error.code || error.name);
  res.status(500).json({
    message: "Có lỗi phía máy chủ. Vui lòng thử lại.",
  });
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`Backend: http://localhost:${port}`);
});