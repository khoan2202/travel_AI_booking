import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { securityHeaders } from "./middleware/security.js";
import cors from "cors";
import pool from "./db/pool.js";
import { createSessionMiddleware } from "./config/session.js";
import tourRoutes from "./routes/tourRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  const production = process.env.NODE_ENV === "production";
  if (
    production &&
    (!process.env.CLIENT_URL ||
      new URL(process.env.CLIENT_URL).protocol !== "https:")
  ) {
    throw new Error("Production requires an HTTPS CLIENT_URL.");
  }
  if (production && process.env.DATABASE_SSL !== "true")
    throw new Error("Production requires DATABASE_SSL=true.");
  app.use(securityHeaders);
  app.locals.clientOrigin = new URL(
    process.env.CLIENT_URL || "http://localhost:5173",
  ).origin;
  if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

  const allowedOrigins = new Set([
    app.locals.clientOrigin,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ]);

  app.locals.allowedOrigins = allowedOrigins;

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "32kb" }));
  const { middleware, store } = createSessionMiddleware();
  app.locals.sessionStore = store;
  app.use(middleware);

  app.get("/api/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        message: "Backend đang chạy",
        database: "PostgreSQL đã kết nối",
      });
    } catch (error) {
      console.error("Lỗi kiểm tra database:", error.code);
      res.status(503).json({ message: "Chưa kết nối được PostgreSQL" });
    }
  });

  app.use("/api/tours", tourRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/recommendations", recommendationRoutes);
  app.use("/api/support", supportRoutes);

  app.use("/api", (req, res) =>
    res.status(404).json({ message: "Đường dẫn API không tồn tại" }),
  );
  if (production || process.env.SERVE_CLIENT === "true") {
    const clientDist = fileURLToPath(
      new URL("../../client/dist/", import.meta.url),
    );
    if (!existsSync(path.join(clientDist, "index.html")))
      throw new Error(
        "Run npm run build in client before serving the website.",
      );
    app.use(express.static(clientDist, { index: false }));
    app.get(/.*/, (req, res, next) => {
      if (path.extname(req.path) || !req.accepts("html")) return next();
      res
        .set("Cache-Control", "no-cache")
        .sendFile(path.join(clientDist, "index.html"));
    });
  }
  app.use((req, res) =>
    res.status(404).json({ message: "Đường dẫn không tồn tại" }),
  );
  app.use((error, req, res, next) => {
    console.error("Lỗi xử lý API:", error.code || error.name);
    const status = [400, 413].includes(error.status) ? error.status : 500;
    res
      .status(status)
      .json({
        message:
          status === 500
            ? "Có lỗi phía máy chủ. Vui lòng thử lại."
            : "Nội dung yêu cầu không hợp lệ hoặc quá lớn.",
      });
  });
  return app;
}
