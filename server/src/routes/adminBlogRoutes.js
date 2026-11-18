// Admin quản lý bài blog. Thao tác ghi nào cũng vào nhật ký.
import { Router } from 'express';
import pool from '../db/pool.js';
import { withTransaction } from '../db/transaction.js';
import { requireCsrf } from '../middleware/csrf.js';
import { audit, check, handle, integer, text } from '../services/adminCommon.js';
import { BLOG_CATEGORIES } from './blogRoutes.js';

const router = Router(); // adminRoutes đã chặn người không phải admin từ trước
const PAGE_SIZE = 15;
const STATUSES = ['draft', 'published', 'archived'];

// GET /posts
router.get('/posts', handle(async (req, res) => {
  const page = req.query.page || '1', status = String(req.query.status || ''), q = String(req.query.q || '').trim();
  check(integer(page, 1, 1000000) && q.length <= 100 && (!status || STATUSES.includes(status)), 'Bộ lọc bài viết chưa hợp lệ.');
  const condition = "WHERE ($1 = '' OR p.status = $1) AND (p.title ILIKE $2 OR p.slug ILIKE $2)";
  const params = [status, `%${q}%`];
  const [rows, count, totals] = await Promise.all([
    pool.query(`SELECT p.id, p.title, p.slug, p.category, p.status, p.featured, p.cover_image, p.published_at, p.updated_at, p.view_count,
        (p.status = 'published' AND p.published_at > NOW()) AS scheduled
      FROM blog_posts p ${condition} ORDER BY p.updated_at DESC, p.id DESC LIMIT ${PAGE_SIZE} OFFSET $3`, [...params, (Number(page) - 1) * PAGE_SIZE]),
    pool.query(`SELECT COUNT(*)::int AS total FROM blog_posts p ${condition}`, params),
    pool.query('SELECT status, COUNT(*)::int AS total, COALESCE(SUM(view_count), 0)::int AS views FROM blog_posts GROUP BY status'),
  ]);
  res.json({ data: {
    items: rows.rows, total: count.rows[0].total, page: Number(page),
    total_pages: Math.max(1, Math.ceil(count.rows[0].total / PAGE_SIZE)),
    counts: Object.fromEntries(totals.rows.map((row) => [row.status, row.total])),
    views: totals.rows.reduce((sum, row) => sum + row.views, 0),
  } });
}));

// GET /posts/:id: cả nội dung, để mở trong trình soạn
router.get('/posts/:id', handle(async (req, res) => {
  check(integer(req.params.id), 'ID bài viết chưa hợp lệ.');
  const post = (await pool.query('SELECT * FROM blog_posts WHERE id = $1', [req.params.id])).rows[0];
  check(post, 'Không tìm thấy bài viết.', 404);
  res.json({ data: post });
}));

// kiểm tra dữ liệu bài viết, sai chỗ nào là báo 400
function postInput(body) {
  check(body && typeof body === 'object', 'Dữ liệu bài viết chưa hợp lệ.');
  const title = text(body.title, 5, 200, 'Tiêu đề');
  const slug = text(body.slug, 2, 220, 'Slug');
  check(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), 'Slug dùng chữ thường không dấu, số và dấu gạch ngang.');
  const excerpt = text(body.excerpt, 20, 400, 'Tóm tắt');
  const content = text(body.content, 50, 50000, 'Nội dung');
  check(BLOG_CATEGORIES.includes(body.category), 'Chuyên mục chưa hợp lệ.');
  check(STATUSES.includes(body.status), 'Trạng thái bài viết chưa hợp lệ.');
  const author = text(body.author_name || 'Travel Mint', 2, 100, 'Tên tác giả');
  check(Array.isArray(body.tags) && body.tags.length <= 10 && body.tags.every((t) => typeof t === 'string' && t.trim().length > 0 && t.length <= 30), 'Tối đa 10 tag, mỗi tag tối đa 30 ký tự.');
  // ảnh bìa: trống, ảnh trong /images/ hoặc link https
  const cover = typeof body.cover_image === 'string' ? body.cover_image.trim() : '';
  if (cover && !/^\/images\/[\w./-]+$/.test(cover)) {
    let url; try { url = new URL(cover); } catch { /* báo lỗi ở dòng dưới */ }
    check(url?.protocol === 'https:' && cover.length <= 2000, 'Ảnh bìa cần là link HTTPS hoặc ảnh trong /images/.');
  }
  check(!cover.includes('..'), 'Đường dẫn ảnh bìa chưa hợp lệ.');
  const destination = body.destination_id === '' || body.destination_id == null ? null : body.destination_id;
  check(destination === null || integer(destination), 'Điểm đến chưa hợp lệ.');
  // bỏ trống là đăng ngay, ngày tương lai là hẹn giờ
  let publishedAt = null;
  if (body.published_at) {
    const parsed = new Date(body.published_at);
    check(Number.isFinite(parsed.getTime()), 'Ngày đăng chưa hợp lệ.');
    publishedAt = parsed.toISOString();
  }
  return {
    title, slug, excerpt, content, category: body.category, status: body.status, author, cover: cover || null,
    tags: [...new Set(body.tags.map((t) => t.trim()))], destination: destination === null ? null : Number(destination),
    featured: body.featured === true, publishedAt,
  };
}

// POST /posts
router.post('/posts', requireCsrf, handle(async (req, res) => {
  const p = postInput(req.body);
  const row = await withTransaction(async (client) => {
    const created = (await client.query(`INSERT INTO blog_posts
        (title, slug, excerpt, content, cover_image, category, tags, destination_id, author_id, author_name, status, featured, published_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::varchar,$12, CASE WHEN $11::varchar = 'published' THEN COALESCE($13::timestamptz, NOW()) ELSE $13::timestamptz END)
      RETURNING *`, [p.title, p.slug, p.excerpt, p.content, p.cover, p.category, p.tags, p.destination, req.user.id, p.author, p.status, p.featured, p.publishedAt])).rows[0];
    await audit(client, req.user.id, 'post.create', 'post', created.id, { title: created.title, status: created.status });
    return created;
  });
  res.status(201).json({ data: row });
}));

// POST /posts/:id/update. Đăng lại bài cũ thì giữ ngày đăng ban đầu.
router.post('/posts/:id/update', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID bài viết chưa hợp lệ.');
  const p = postInput(req.body);
  const row = await withTransaction(async (client) => {
    const updated = (await client.query(`UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, content=$4, cover_image=$5, category=$6, tags=$7,
        destination_id=$8, author_name=$9, status=$10::varchar, featured=$11, updated_at=NOW(),
        published_at = CASE WHEN $10::varchar = 'published' THEN COALESCE($12::timestamptz, published_at, NOW()) ELSE COALESCE($12::timestamptz, published_at) END
      WHERE id=$13 RETURNING *`, [p.title, p.slug, p.excerpt, p.content, p.cover, p.category, p.tags, p.destination, p.author, p.status, p.featured, p.publishedAt, req.params.id])).rows[0];
    check(updated, 'Không tìm thấy bài viết.', 404);
    await audit(client, req.user.id, 'post.update', 'post', updated.id, { title: updated.title, status: updated.status });
    return updated;
  });
  res.json({ data: row });
}));

// POST /posts/:id/delete. Xóa hẳn, nhưng nhật ký vẫn giữ tiêu đề bài.
router.post('/posts/:id/delete', requireCsrf, handle(async (req, res) => {
  check(integer(req.params.id), 'ID bài viết chưa hợp lệ.');
  const row = await withTransaction(async (client) => {
    const removed = (await client.query('DELETE FROM blog_posts WHERE id = $1 RETURNING id, title', [req.params.id])).rows[0];
    check(removed, 'Không tìm thấy bài viết.', 404);
    await audit(client, req.user.id, 'post.delete', 'post', removed.id, { title: removed.title });
    return removed;
  });
  res.json({ data: row });
}));

export default router;
