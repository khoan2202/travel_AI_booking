// /api/blog, ai cũng xem được. Chỉ trả bài đã đăng và đã tới giờ, còn nháp, bài ẩn, bài hẹn giờ thì giấu.
import { Router } from 'express';
import pool from '../db/pool.js';
import { check, handle, integer } from '../services/adminCommon.js';

const router = Router();
const PAGE_SIZE = 9;
export const BLOG_CATEGORIES = ['guide', 'destination', 'food', 'tips'];
// điều kiện để khách thấy một bài
const VISIBLE = "p.status = 'published' AND p.published_at <= NOW()";
// cột cho thẻ bài (không lấy nội dung dài cho nhẹ)
const CARD = `p.id, p.title, p.slug, p.excerpt, p.cover_image, p.category, p.tags, p.author_name,
  p.featured, p.published_at, p.view_count, char_length(p.content) AS content_length, d.name AS destination`;
const FROM = 'FROM blog_posts p LEFT JOIN destinations d ON d.id = p.destination_id';
// lỗi "chưa có bảng", tức là chưa chạy sql/009
const MISSING_TABLE = '42P01';

// GET /api/blog: lọc theo chuyên mục, từ khóa; 9 bài một trang
router.get('/', handle(async (req, res) => {
  const page = req.query.page || '1', category = String(req.query.category || ''), q = String(req.query.q || '').trim();
  check(integer(page, 1, 100000) && q.length <= 100 && (!category || BLOG_CATEGORIES.includes(category)), 'Bộ lọc bài viết chưa hợp lệ.');
  try {
    // bài nổi bật chỉ tách ra khi đang xem tất cả (không lọc, không tìm)
    const plain = !category && !q;
    const featured = plain
      ? (await pool.query(`SELECT ${CARD} ${FROM} WHERE ${VISIBLE} AND p.featured ORDER BY p.published_at DESC LIMIT 1`)).rows[0] ?? null
      : null;
    const values = [], where = [VISIBLE];
    if (category) { values.push(category); where.push(`p.category = $${values.length}`); }
    if (q) { values.push(`%${q}%`); where.push(`(p.title ILIKE $${values.length} OR p.excerpt ILIKE $${values.length})`); }
    if (featured) { values.push(featured.id); where.push(`p.id <> $${values.length}`); }
    const condition = where.join(' AND ');
    const [rows, count, groups] = await Promise.all([
      pool.query(`SELECT ${CARD} ${FROM} WHERE ${condition} ORDER BY p.published_at DESC, p.id DESC LIMIT ${PAGE_SIZE} OFFSET $${values.length + 1}`, [...values, (Number(page) - 1) * PAGE_SIZE]),
      pool.query(`SELECT COUNT(*)::int AS total FROM blog_posts p WHERE ${condition}`, values),
      pool.query(`SELECT p.category, COUNT(*)::int AS total FROM blog_posts p WHERE ${VISIBLE} GROUP BY p.category`),
    ]);
    const total = count.rows[0].total;
    res.json({ data: {
      featured: Number(page) === 1 ? featured : null,
      items: rows.rows, total, page: Number(page),
      total_pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      categories: Object.fromEntries(groups.rows.map((row) => [row.category, row.total])),
    } });
  } catch (error) {
    // chưa có bảng thì coi như blog trống, trang vẫn mở được
    if (error.code !== MISSING_TABLE) throw error;
    res.json({ data: { featured: null, items: [], total: 0, page: 1, total_pages: 1, categories: {} } });
  }
}));

// GET /api/blog/:slug: kèm bài liên quan và tour gợi ý. Mỗi lần mở cộng 1 lượt xem.
router.get('/:slug', handle(async (req, res) => {
  const slug = req.params.slug;
  check(slug.length <= 220 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 'Không tìm thấy bài viết.', 404);
  res.set('Cache-Control', 'no-store');
  try {
    const updated = await pool.query(`UPDATE blog_posts p SET view_count = view_count + 1 WHERE p.slug = $1 AND ${VISIBLE} RETURNING p.id`, [slug]);
    check(updated.rowCount, 'Không tìm thấy bài viết.', 404);
    const post = (await pool.query(`SELECT ${CARD}, p.content, p.destination_id, p.updated_at ${FROM} WHERE p.id = $1`, [updated.rows[0].id])).rows[0];
    const [related, tours] = await Promise.all([
      // cùng chuyên mục lên trước, rồi tới bài mới
      pool.query(`SELECT ${CARD} ${FROM} WHERE ${VISIBLE} AND p.id <> $1
        ORDER BY (p.category = $2) DESC, p.published_at DESC LIMIT 3`, [post.id, post.category]),
      // tour còn đặt được, tour cùng điểm đến với bài lên trước
      pool.query(`SELECT t.id, t.title, t.image_url, t.duration_days, d.name AS destination, d.region,
          MIN(td.price_per_person)::text AS price_from
        FROM tours t JOIN destinations d ON d.id = t.destination_id
        JOIN tour_departures td ON td.tour_id = t.id AND td.status = 'scheduled'
          AND td.start_date > CURRENT_DATE AND td.seats_booked < td.capacity
        WHERE t.status = 'active'
        GROUP BY t.id, d.name, d.region
        ORDER BY (t.destination_id IS NOT DISTINCT FROM $1::int) DESC, MIN(td.price_per_person) LIMIT 3`, [post.destination_id]),
    ]);
    res.json({ data: { post, related: related.rows, tours: tours.rows } });
  } catch (error) {
    if (error.code === MISSING_TABLE) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });
    throw error;
  }
}));

export default router;
