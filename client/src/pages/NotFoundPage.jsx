import { Link } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function NotFoundPage() {
  return (
    <>
      <Header />
      <main className="container detail-state">
        <p className="section-kicker">404</p>
        <h1>Không tìm thấy trang</h1>
        <p>Đường dẫn này chưa có nội dung. Bạn có thể quay lại để chọn một tour khác.</p>
        <Link className="button button-primary" to="/#tours">Về danh sách tour</Link>
      </main>
      <Footer />
    </>
  );
}
