// Blog: bài nổi bật, lọc chuyên mục, tìm kiếm, phân trang.
// Bộ lọc nằm trên URL (?category=food&q=hue) nên gửi link cho ai cũng thấy đúng kết quả.
import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import BlogCard from "../components/BlogCard.jsx";
import useLoad from "../hooks/useLoad.js";
import { getBlogPosts } from "../services/blogApi.js";
import { BLOG_CATEGORIES, DEFAULT_COVER, formatDate, readingMinutes } from "../utils/blog.js";

export default function BlogPage() {
  const [params, setParams] = useSearchParams();
  const category = BLOG_CATEGORIES[params.get("category")] ? params.get("category") : "";
  const q = params.get("q") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [draft, setDraft] = useState(q);
  // bấm "Thử lại" thì retry tăng, ép tải lại
  const [retry, setRetry] = useState(0);

  const load = useCallback((signal) => getBlogPosts({ page, category, q }, signal), [page, category, q]);
  const { data, error, loading } = useLoad(load, retry);

  // đổi bộ lọc thì về trang 1, tham số trống thì bỏ cho URL gọn
  function update(next) {
    const merged = { category, q, page: 1, ...next };
    setParams(Object.fromEntries(Object.entries(merged).filter(([key, value]) => value && !(key === "page" && value === 1))));
  }

  const featured = data?.featured;
  const filtered = Boolean(category || q);

  return (
    <>
      <Header />
      <main className="blog-page">
        <section className="blog-hero">
          <div className="container">
            <p className="section-kicker">NHẬT KÝ TRAVEL MINT</p>
            <h1>Những câu chuyện <em>trước khi lên đường</em></h1>
            <p>Cẩm nang điểm đến, món ngon và kinh nghiệm để chuyến đi tiếp theo của bạn trọn vẹn hơn.</p>
          </div>
        </section>

        <div className="container">
          {/* bài nổi bật chỉ hiện khi xem tất cả, ở trang đầu */}
          {featured && !filtered && (
            <article className="blog-featured">
              <Link className="blog-featured-photo" to={`/blog/${featured.slug}`} tabIndex={-1} aria-hidden="true">
                <img src={featured.cover_image || DEFAULT_COVER} alt="" width="900" height="600" />
              </Link>
              <div className="blog-featured-text">
                <p className="blog-meta"><span>Bài nổi bật</span> · {BLOG_CATEGORIES[featured.category]}</p>
                <h2><Link to={`/blog/${featured.slug}`}>{featured.title}</Link></h2>
                <p>{featured.excerpt}</p>
                <p className="blog-byline">{featured.author_name} · {formatDate(featured.published_at)} · {readingMinutes(featured.content_length)} phút đọc</p>
                <Link className="button button-primary" to={`/blog/${featured.slug}`}>Đọc bài viết <span aria-hidden="true">→</span></Link>
              </div>
            </article>
          )}

          <div className="blog-toolbar">
            <div className="blog-chips" role="group" aria-label="Chuyên mục">
              <button type="button" aria-pressed={!category} onClick={() => update({ category: "" })}>Tất cả</button>
              {Object.entries(BLOG_CATEGORIES).map(([value, label]) => (
                <button key={value} type="button" aria-pressed={category === value} onClick={() => update({ category: value })}>
                  {label}{data?.categories?.[value] ? <small>{data.categories[value]}</small> : null}
                </button>
              ))}
            </div>
            <form className="blog-search" role="search" onSubmit={(event) => { event.preventDefault(); update({ q: draft.trim() }); }}>
              <input aria-label="Tìm bài viết" placeholder="Tìm bài viết…" value={draft} maxLength="100" onChange={(event) => setDraft(event.target.value)} />
              <button className="button button-secondary">Tìm</button>
            </form>
          </div>

          {/* lần lượt: lỗi, đang tải, không có kết quả, danh sách bài */}
          {error ? (
            <div className="state-box error-box" role="alert"><p>{error}</p><button className="button button-primary" type="button" onClick={() => setRetry((n) => n + 1)}>Thử lại</button></div>
          ) : !data ? (
            <div className="blog-grid" role="status" aria-label="Đang tải bài viết">{[0, 1, 2].map((n) => <div key={n} className="blog-skeleton" />)}</div>
          ) : data.items.length === 0 && !featured ? (
            <div className="state-box">
              <h3>{filtered ? "Không tìm thấy bài viết phù hợp" : "Blog đang được chuẩn bị"}</h3>
              <p>{filtered ? "Hãy thử từ khóa khác hoặc xem tất cả chuyên mục." : "Những bài viết đầu tiên sẽ sớm xuất hiện ở đây."}</p>
              {filtered && <button className="button button-secondary" type="button" onClick={() => { setDraft(""); setParams({}); }}>Xem tất cả bài viết</button>}
            </div>
          ) : (
            <div className={loading ? "blog-grid is-loading" : "blog-grid"}>{data.items.map((post) => <BlogCard key={post.id} post={post} />)}</div>
          )}

          {data && data.total_pages > 1 && (
            <nav className="booking-pagination" aria-label="Phân trang bài viết">
              <button className="button button-secondary" type="button" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>Trang trước</button>
              <span>{data.page} / {data.total_pages}</span>
              <button className="button button-secondary" type="button" disabled={page >= data.total_pages} onClick={() => update({ page: page + 1 })}>Trang sau</button>
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
