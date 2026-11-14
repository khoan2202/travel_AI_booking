// API đặt tour của khách. Gắn tại /api/bookings. Mọi route ở đây đều cần đăng nhập.
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { create, listMine, detail, cancel } from '../controllers/bookingController.js';

const router = Router();
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
// Bắt buộc đăng nhập cho toàn bộ route bên dưới.
router.use(requireAuth);
// Tối đa 60 lần đặt/hủy trong 15 phút.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { message: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.' },
});
// GET /: đơn của tôi. GET /:id: chi tiết một đơn.
router.get('/', listMine);
router.get('/:id', detail);
// POST /: tạo đơn mới. POST /:id/cancel: hủy đơn.
router.post('/', writeLimiter, requireCsrf, create);
router.post('/:id/cancel', writeLimiter, requireCsrf, cancel);
export default router;
