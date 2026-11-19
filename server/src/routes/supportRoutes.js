// /api/support: nhận form từ trang Liên hệ.
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { createSupportRequest } from '../controllers/supportController.js';

const router = Router();

// 10 yêu cầu mỗi 15 phút cho đỡ spam
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    message: 'Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau 15 phút.',
  },
});

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// có đăng nhập thì kiểm tra tài khoản, chưa đăng nhập vẫn cho gửi
function optionalAuth(req, res, next) {
  if (req.session?.userId != null) {
    return requireAuth(req, res, next);
  }

  next();
}

router.post('/', supportLimiter, requireCsrf, optionalAuth, createSupportRequest);

export default router;
