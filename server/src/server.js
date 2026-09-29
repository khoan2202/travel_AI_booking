import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

const app = express();
const pool = new Pool();

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
    console.error("Database connection error:", error.code);
    res.status(503).json({
      message: "Chưa kết nối được PostgreSQL",
    });
  }
});

const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`Backend: http://localhost:${port}`);
});