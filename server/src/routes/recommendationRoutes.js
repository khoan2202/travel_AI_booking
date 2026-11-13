// API gợi ý tour và tư vấn AI. Gắn tại /api/recommendations.
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { check, handle, text } from '../services/adminCommon.js';
import { readFilters, recommend, recommendationOptions } from '../services/recommendationService.js';
import { consult } from '../services/consultationService.js';
const router = Router();
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
// Hai lớp giới hạn cho chat AI (mỗi 10 phút): 30 câu mỗi IP và 10 câu mỗi tài khoản.
// Mục đích: tránh tốn quota Gemini.
const limitMessage = { message: 'Bạn đã gửi nhiều câu hỏi. Vui lòng chờ vài phút rồi thử lại.' };
const ipLimit = rateLimit({ windowMs: 600000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage });
const userLimit = rateLimit({ windowMs: 600000, limit: 10, keyGenerator: req => String(req.user.id), standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage });
// GET /options: các lựa chọn cho bộ lọc (khu vực, tag, ...).
router.get('/options', handle(async (req, res) => res.json({ data: await recommendationOptions() })));
// GET /: lọc tour theo ngân sách, số ngày, số khách... (truy vấn SQL, không dùng AI).
router.get('/', handle(async (req, res) => {
  const filters = readFilters(req.query); res.json({ data: { filters, items: await recommend(filters) } });
}));
// POST /consult: chat tư vấn. Cần đăng nhập.
// Bước 1: lọc tour từ DB. Bước 2: gửi danh sách đó cho Gemini để chọn và giải thích.
router.post('/consult', requireAuth, requireCsrf, ipLimit, userLimit, handle(async (req, res) => {
  const message = text(req.body?.message, 3, 1200, 'Câu hỏi');
  const filters = readFilters(req.body?.filters);
  const history = req.body?.history ?? [];
  // Lịch sử chat tối đa 4 tin, mỗi tin tối đa 700 ký tự.
  check(Array.isArray(history) && history.length <= 4 && history.every(h => h && ['user', 'assistant'].includes(h.role) && typeof h.text === 'string' && h.text.length <= 700), 'Lịch sử hội thoại chưa hợp lệ.');
  // Explicit fields only: no account profile, order data or contact info is added.
  const result = await consult({ message, history: history.map(h => ({ role: h.role, text: h.text })), filters, catalog: await recommend(filters) });
  // Gemini trả lời mất vài giây, trong lúc đó tour có thể hết chỗ, nên lọc lại theo dữ liệu mới nhất.
  if (result.source === 'gemini') {
    // Recheck availability after AI latency. Checkout revalidates again inside its transaction.
    const fresh = new Map((await recommend(filters)).map(t => [t.id, t]));
    result.recommendations = result.recommendations.filter(t => fresh.has(t.id)).map(t => ({ ...fresh.get(t.id), reason: t.reason }));
  }
  res.json({ data: result });
}));
export default router;
