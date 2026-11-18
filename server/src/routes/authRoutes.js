// /api/auth: đăng ký, đăng nhập, đăng xuất.
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { getCsrfToken, register, login, me, logout } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

const router = Router();

// sai quá 10 lần trong 15 phút thì chặn (đăng nhập đúng không tính), chống dò mật khẩu
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ tối đa 15 phút rồi thử lại." },
});

// tối đa 10 tài khoản mỗi giờ trên một IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Bạn tạo tài khoản quá nhiều lần. Vui lòng thử lại sau." },
});

// không cache nhóm API này
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
// GET /csrf: token cho các request ghi
router.get("/csrf", getCsrfToken);
router.get("/me", requireAuth, me);
// thứ tự: giới hạn tần suất, rồi CSRF, rồi mới tới hàm xử lý
router.post("/register", registerLimiter, requireCsrf, register);
router.post("/login", loginLimiter, requireCsrf, login);
router.post("/logout", requireCsrf, logout);

export default router;
