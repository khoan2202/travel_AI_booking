// /api/recommendations: gợi ý tour bằng bộ lọc và chat tư vấn AI.
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { check, handle, text } from '../services/adminCommon.js';
import { readFilters, recommend, recommendationOptions } from '../services/recommendationService.js';
import { consult } from '../services/consultationService.js';
const router = Router();
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
// giới hạn chat AI mỗi 10 phút: 30 câu một IP, 10 câu một tài khoản, để khỏi cạn quota Gemini
const limitMessage = { message: 'Bạn đã gửi nhiều câu hỏi. Vui lòng chờ vài phút rồi thử lại.' };
const ipLimit = rateLimit({ windowMs: 600000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage });
const userLimit = rateLimit({ windowMs: 600000, limit: 10, keyGenerator: req => String(req.user.id), standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage });
// GET /options: khu vực, sở thích cho ô lọc
router.get('/options', handle(async (req, res) => res.json({ data: await recommendationOptions() })));
// GET /: lọc bằng SQL thuần, không dùng AI
router.get('/', handle(async (req, res) => {
  const filters = readFilters(req.query); res.json({ data: { filters, items: await recommend(filters) } });
}));
// POST /consult (phải đăng nhập). Lọc tour từ DB trước, rồi đưa danh sách đó cho Gemini chọn và giải thích.
router.post('/consult', requireAuth, requireCsrf, ipLimit, userLimit, handle(async (req, res) => {
  const message = text(req.body?.message, 3, 1200, 'Câu hỏi');
  const filters = readFilters(req.body?.filters);
  const history = req.body?.history ?? [];
  // lịch sử chat tối đa 4 tin, mỗi tin 700 ký tự
  check(Array.isArray(history) && history.length <= 4 && history.every(h => h && ['user', 'assistant'].includes(h.role) && typeof h.text === 'string' && h.text.length <= 700), 'Lịch sử hội thoại chưa hợp lệ.');
  // chỉ gửi đúng mấy trường này, không kèm thông tin tài khoản, đơn hàng hay liên hệ
  const result = await consult({ message, history: history.map(h => ({ role: h.role, text: h.text })), filters, catalog: await recommend(filters) });
  // Gemini trả lời mất vài giây, tour có thể hết chỗ trong lúc đó nên lọc lại
  if (result.source === 'gemini') {
    // lúc đặt tour sẽ kiểm tra lại lần nữa trong transaction
    const fresh = new Map((await recommend(filters)).map(t => [t.id, t]));
    result.recommendations = result.recommendations.filter(t => fresh.has(t.id)).map(t => ({ ...fresh.get(t.id), reason: t.reason }));
  }
  res.json({ data: result });
}));
export default router;
