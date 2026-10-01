import { Link } from "react-router";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <Link to="/" className="brand">TRAVEL <span>MINT.</span></Link>
        <p>Khám phá những hành trình đáng nhớ.</p>
        <small>Đồ án học tập · Tour và giá là dữ liệu mẫu.</small>
      </div>
    </footer>
  );
}
