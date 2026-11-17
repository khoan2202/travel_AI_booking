// Chân trang, dùng chung cho mọi trang.
import { Link } from "react-router";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Link to="/" className="brand">TRAVEL <span>MINT.</span></Link>
        <p>Khám phá những hành trình đáng nhớ.</p>
        {/* Lối tắt tới các tính năng và trang ghi công nguồn ảnh */}
        <nav className="footer-links" aria-label="Liên kết chân trang">
          <Link to="/quiz">Quiz tìm chuyến đi</Link>
          <Link to="/compare">So sánh tour</Link>
          <Link to="/recommendations">Tư vấn AI</Link>
          <Link to="/contact">Liên hệ</Link>
          <Link to="/credits">Nguồn ảnh</Link>
        </nav>
        <small>Đồ án học tập · Tour và giá là dữ liệu mẫu.</small>
      </div>
    </footer>
  );
}
