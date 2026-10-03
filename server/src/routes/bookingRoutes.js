import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { create, listMine, detail, cancel } from '../controllers/bookingController.js';

const router = Router();
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.use(requireAuth);
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { message: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.' },
});
router.get('/', listMine);
router.get('/:id', detail);
router.post('/', writeLimiter, requireCsrf, create);
router.post('/:id/cancel', writeLimiter, requireCsrf, cancel);
export default router;
