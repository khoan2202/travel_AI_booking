// API đăng ký, đăng nhập, đăng xuất. Gắn tại /api/auth.
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { getCsrfToken, register, login, me, logout } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";

const router = Router();

// Giới hạn đăng nhập: tối đa 10 lần sai trong 15 phút (lần đúng không bị tính).
// Mục đích: chống dò mật khẩu.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Bạn thử đăng nhập quá nhiều lần. Vui lòng chờ tối đa 15 phút rồi thử lại." },
});

// Giới hạn đăng ký: tối đa 10 tài khoản mỗi giờ trên một IP.
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Bạn tạo tài khoản quá nhiều lần. Vui lòng thử lại sau." },
});

// Không cho trình duyệt hay proxy lưu cache response của nhóm API này.
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
// GET /csrf: lấy CSRF token để dùng cho các request ghi dữ liệu.
router.get("/csrf", getCsrfToken);
// GET /me: thông tin người đang đăng nhập.
router.get("/me", requireAuth, me);
// Thứ tự middleware: giới hạn tần suất -> kiểm tra CSRF -> hàm xử lý chính.
router.post("/register", registerLimiter, requireCsrf, register);
router.post("/login", loginLimiter, requireCsrf, login);
router.post("/logout", requireCsrf, logout);

export default router;
