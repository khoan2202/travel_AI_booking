// Thẻ một bài blog, dùng ở trang blog và mục "Đọc tiếp".
import { Link } from "react-router";
import { BLOG_CATEGORIES, DEFAULT_COVER, formatDate, readingMinutes } from "../utils/blog.js";

export default function BlogCard({ post }) {
  return (
    <article className="blog-card">
      <Link className="blog-card-photo" to={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">
        <img src={post.cover_image || DEFAULT_COVER} alt="" loading="lazy" decoding="async" width="640" height="400" />
      </Link>
      <p className="blog-meta"><span>{BLOG_CATEGORIES[post.category]}</span> · {readingMinutes(post.content_length)} phút đọc</p>
      <h3><Link to={`/blog/${post.slug}`}>{post.title}</Link></h3>
      <p className="blog-card-excerpt">{post.excerpt}</p>
      <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
    </article>
  );
}
