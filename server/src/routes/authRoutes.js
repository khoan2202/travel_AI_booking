import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { getCsrfToken, register, login, me, logout } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ tối đa 15 phút rồi thử lại." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Bạn tạo tài khoản quá nhiều lần. Vui lòng thử lại sau." },
});

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.get("/csrf", getCsrfToken);
router.get("/me", requireAuth, me);
router.post("/register", registerLimiter, requireCsrf, register);
router.post("/login", loginLimiter, requireCsrf, login);
router.post("/logout", requireCsrf, logout);

export default router;
