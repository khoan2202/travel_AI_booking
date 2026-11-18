// Trang quản lý blog (/admin/blog): danh sách bài viết, lọc theo trạng thái, tìm kiếm.
import { useCallback, useState } from "react";
import { Link } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import AdminNav from "../components/AdminNav.jsx";
import AdminPager from "../components/AdminPager.jsx";
import useLoad from "../hooks/useLoad.js";
import { getAdminPosts } from "../services/adminApi.js";
import { BLOG_CATEGORIES, DEFAULT_COVER, POST_STATUSES, formatDateTime } from "../utils/blog.js";

// Màu nhãn theo trạng thái; bài đã đăng nhưng chưa tới giờ hiện là "Hẹn giờ".
function statusPill(post) {
  if (post.scheduled) return <span className="pill pill-warn">Hẹn giờ</span>;
  return <span className={`pill ${post.status === "published" ? "pill-good" : "pill-muted"}`}>{POST_STATUSES[post.status]}</span>;
}

export default function AdminBlogPage() {
  const [filters, setFilters] = useState({ page: 1, status: "", q: "" });
  const [draft, setDraft] = useState("");
  const load = useCallback((signal) => getAdminPosts(filters, signal), [filters]);
  const { data, error, loading } = useLoad(load);
  const tabs = [["", "Tất cả"], ...Object.entries(POST_STATUSES)];
  const total = data ? Object.values(data.counts).reduce((sum, n) => sum + n, 0) : 0;

  return <><Header /><main className="container admin-page"><AdminNav />
    <div className="admin-title-row">
      <div><p className="section-kicker">NỘI DUNG</p><h1>Bài viết blog</h1></div>
      <div className="admin-quick"><Link className="button button-primary" to="/admin/blog/new">Viết bài mới</Link><Link className="button button-secondary" to="/blog">Xem trang Blog</Link></div>
    </div>

    <div className="admin-toolbar">
      <div className="admin-tabs" role="group" aria-label="Lọc theo trạng thái">
        {tabs.map(([value, label]) => <button key={value} type="button" aria-pressed={filters.status === value} onClick={() => setFilters({ ...filters, status: value, page: 1 })}>
          {label} <small>{data ? (value ? data.counts[value] || 0 : total) : ""}</small>
        </button>)}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); setFilters({ ...filters, q: draft.trim(), page: 1 }); }}>
        <input aria-label="Tìm bài viết" placeholder="Tiêu đề hoặc slug" value={draft} maxLength="100" onChange={(event) => setDraft(event.target.value)} />
        <button className="button button-secondary">Tìm</button>
      </form>
    </div>

    {error ? <div className="state-box" role="alert"><p>{error}</p><button className="button button-secondary" type="button" onClick={() => setFilters({ ...filters })}>Thử lại</button></div>
      : !data ? <p role="status">Đang tải bài viết…</p>
      : data.items.length === 0 ? <div className="state-box"><p>Chưa có bài viết phù hợp.</p><Link className="button button-primary" to="/admin/blog/new">Viết bài đầu tiên</Link></div>
      : <div className={loading ? "admin-table-wrap is-loading" : "admin-table-wrap"}><table className="admin-table">
        <caption>{data.total} bài viết · {data.views.toLocaleString("vi-VN")} lượt xem toàn blog</caption>
        <thead><tr><th>Bài viết</th><th>Chuyên mục</th><th>Trạng thái</th><th>Lượt xem</th><th>Cập nhật</th><th>Thao tác</th></tr></thead>
        <tbody>{data.items.map((post) => <tr key={post.id}>
          <td><div className="admin-post-cell"><img src={post.cover_image || DEFAULT_COVER} alt="" width="72" height="48" loading="lazy" /><span>{post.title}{post.featured && <small>Bài nổi bật</small>}</span></div></td>
          <td>{BLOG_CATEGORIES[post.category]}</td>
          <td>{statusPill(post)}{post.scheduled && <small>{formatDateTime(post.published_at)}</small>}</td>
          <td>{post.view_count.toLocaleString("vi-VN")}</td>
          <td>{formatDateTime(post.updated_at)}</td>
          <td><div className="admin-row-actions">
            <Link className="button button-secondary" to={`/admin/blog/${post.id}`} aria-label={`Sửa bài ${post.title}`}>Sửa</Link>
            {post.status === "published" && !post.scheduled && <Link className="button button-secondary" to={`/blog/${post.slug}`} aria-label={`Xem bài ${post.title}`}>Xem</Link>}
          </div></td>
        </tr>)}</tbody>
      </table></div>}
    {data && <AdminPager page={data.page} totalPages={data.total_pages} onPage={(page) => setFilters({ ...filters, page })} />}
  </main><Footer /></>;
}
