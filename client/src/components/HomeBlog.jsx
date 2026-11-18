// Khối "Bài viết mới" ở trang chủ: 1 bài lớn và 2 bài nhỏ.
// Chưa có bài hoặc tải lỗi thì ẩn cả khối, để trang chủ không bao giờ bị ảnh hưởng.
import { Link } from "react-router";
import useLoad from "../hooks/useLoad.js";
import { getBlogPosts } from "../services/blogApi.js";
import { BLOG_CATEGORIES, DEFAULT_COVER, formatDate, readingMinutes } from "../utils/blog.js";

// Đặt ngoài component để hàm không đổi giữa các lần vẽ, tránh tải lại liên tục.
const loadLatest = (signal) => getBlogPosts({ page: 1 }, signal);

export default function HomeBlog() {
  const { data } = useLoad(loadLatest);
  // API tách riêng bài nổi bật, nên ghép lại để bài nổi bật đứng đầu.
  const posts = data ? [data.featured, ...data.items].filter(Boolean).slice(0, 3) : [];
  if (posts.length === 0) return null;
  const [lead, ...others] = posts;

  return (
    <section className="section container home-blog" aria-labelledby="home-blog-heading">
      <div className="section-heading">
        <div><p className="section-kicker">NHẬT KÝ TRAVEL MINT</p><h2 id="home-blog-heading">Đọc trước khi lên đường</h2></div>
        <Link className="home-blog-all" to="/blog">Xem tất cả bài viết <span aria-hidden="true">→</span></Link>
      </div>
      <div className={others.length ? "home-blog-grid" : "home-blog-grid is-single"}>
        <article className="home-blog-lead">
          <img src={lead.cover_image || DEFAULT_COVER} alt="" loading="lazy" decoding="async" width="900" height="600" />
          <div className="home-blog-lead-text">
            <p><span>{BLOG_CATEGORIES[lead.category]}</span> · {readingMinutes(lead.content_length)} phút đọc</p>
            {/* Link phủ kín cả thẻ (xem CSS) nên bấm vào đâu trên ảnh cũng mở bài */}
            <h3><Link to={`/blog/${lead.slug}`}>{lead.title}</Link></h3>
            <time dateTime={lead.published_at}>{formatDate(lead.published_at)}</time>
          </div>
        </article>
        {others.length > 0 && (
          <div className="home-blog-side">
            {others.map((post) => (
              <article className="home-blog-item" key={post.id}>
                <img src={post.cover_image || DEFAULT_COVER} alt="" loading="lazy" decoding="async" width="320" height="240" />
                <div>
                  <p className="blog-meta"><span>{BLOG_CATEGORIES[post.category]}</span> · {readingMinutes(post.content_length)} phút đọc</p>
                  <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
                  <p className="home-blog-excerpt">{post.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
