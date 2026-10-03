import { Link } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <><Header /><main className="container account-page">
      <p className="section-kicker">TÀI KHOẢN CỦA BẠN</p>
      <h1>Xin chào, {user.name}.</h1>
      <p className="account-intro">Thông tin tài khoản đang đăng nhập trên Travel Mint.</p>
      <section className="account-card" aria-labelledby="profile-title">
        <div className="account-card-heading"><h2 id="profile-title">Thông tin cá nhân</h2><span className="role-badge">{user.role === "admin" ? "Quản trị viên" : "Thành viên"}</span></div>
        <dl className="profile-fields"><div><dt>Họ và tên</dt><dd>{user.name}</dd></div><div><dt>Email</dt><dd>{user.email}</dd></div></dl>
        <div className="account-actions"><Link className="button button-primary" to="/#tours">Khám phá tour <span aria-hidden="true">↗</span></Link>{user.role === "admin" && <Link className="button button-secondary" to="/admin">Mở trang quản trị</Link>}</div>
      </section>
    </main><Footer /></>
  );
}
