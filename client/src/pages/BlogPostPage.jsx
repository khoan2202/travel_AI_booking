// Đọc một bài blog: thanh tiến độ, mục lục, nội dung, tour gợi ý, bài liên quan.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import BlogCard from "../components/BlogCard.jsx";
import MarkdownContent from "../components/MarkdownContent.jsx";
import TourImage from "../components/TourImage.jsx";
import useLoad from "../hooks/useLoad.js";
import { getBlogPost } from "../services/blogApi.js";
import { BLOG_CATEGORIES, DEFAULT_COVER, formatDate, readingMinutes } from "../utils/blog.js";
import { formatPrice } from "../utils/format.js";
import { parseMarkdown } from "../utils/markdown.js";

export default function BlogPostPage() {
  const { slug } = useParams();
  const load = useCallback((signal) => getBlogPost(slug, signal), [slug]);
  const { data, error, loading } = useLoad(load);
  const post = !loading ? data?.post : null;
  const blocks = useMemo(() => (post ? parseMarkdown(post.content) : []), [post]);
  const headings = blocks.filter((block) => block.type === "h2");
  const articleRef = useRef(null);
  const barRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // tên bài lên tab trình duyệt
  useEffect(() => {
    if (!post) return undefined;
    const previous = document.title;
    document.title = `${post.title} | Travel Mint`;
    return () => { document.title = previous; };
  }, [post]);

  // thanh tiến độ ghi thẳng vào style, khỏi bắt React vẽ lại mỗi lần cuộn
  useEffect(() => {
    if (!post) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const article = articleRef.current;
      if (!article || !barRef.current) return;
      const box = article.getBoundingClientRect();
      const distance = box.height - window.innerHeight;
      const progress = distance > 0 ? Math.min(Math.max(-box.top / distance, 0), 1) : 1;
      barRef.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [post]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (error || (!loading && !post)) {
    return (
      <>
        <Header />
        <main className="container blog-missing">
          <div className="state-box" role="alert">
            <h3>Không mở được bài viết</h3>
            <p>{error || "Bài viết không tồn tại hoặc đã được gỡ."}</p>
            <Link className="button button-primary" to="/blog">Về trang Blog</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return <><Header /><main className="container blog-missing"><p role="status">Đang tải bài viết…</p></main><Footer /></>;
  }

  return (
    <>
      <Header />
      <div className="read-progress" aria-hidden="true"><span ref={barRef} /></div>
      <main className="post-page">
        <header className="post-hero">
          <img src={post.cover_image || DEFAULT_COVER} alt="" width="1600" height="900" />
          <div className="post-hero-shade" />
          <div className="container post-hero-text">
            <nav className="post-crumbs" aria-label="Đường dẫn">
              <Link to="/blog">Blog</Link> <span aria-hidden="true">/</span> <Link to={`/blog?category=${post.category}`}>{BLOG_CATEGORIES[post.category]}</Link>
            </nav>
            <h1>{post.title}</h1>
            <p className="post-byline">{post.author_name} · <time dateTime={post.published_at}>{formatDate(post.published_at)}</time> · {readingMinutes(post.content_length)} phút đọc</p>
          </div>
        </header>

        <div className="container post-layout">
          {/* mục lục chỉ có khi bài từ 2 mục trở lên */}
          {headings.length > 1 && (
            <aside className="post-toc">
              <p>Trong bài này</p>
              <ol>{headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ol>
            </aside>
          )}

          <article className="post-article" ref={articleRef}>
            <p className="post-lead">{post.excerpt}</p>
            <MarkdownContent blocks={blocks} />
            <footer className="post-foot">
              <div className="post-tags">{post.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
              <button className="button button-secondary" type="button" onClick={copyLink}>{copied ? "Đã sao chép link" : "Sao chép link bài viết"}</button>
              <span className="visually-hidden" role="status">{copied ? "Đã sao chép link bài viết" : ""}</span>
            </footer>
            <p className="post-credit">Ảnh trong bài được ghi nguồn tại trang <Link to="/credits">Nguồn ảnh</Link>.</p>
          </article>
        </div>

        {/* đọc xong thì dẫn sang tour */}
        {data.tours.length > 0 && (
          <section className="post-tours">
            <div className="container">
              <p className="section-kicker">ĐI THÔI</p>
              <h2>Biến bài viết thành chuyến đi</h2>
              <div className="post-tour-grid">
                {data.tours.map((tour) => (
                  <Link className="post-tour" key={tour.id} to={`/tours/${tour.id}`}>
                    <TourImage tour={tour} />
                    <span className="post-tour-text">
                      <small>{tour.destination} · {tour.region}</small>
                      <strong>{tour.title}</strong>
                      <em>Từ {formatPrice(tour.price_from)} / người</em>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {data.related.length > 0 && (
          <section className="container post-related">
            <h2>Đọc tiếp</h2>
            <div className="blog-grid">{data.related.map((item) => <BlogCard key={item.id} post={item} />)}</div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
