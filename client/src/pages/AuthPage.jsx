import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.js";
import { registerUser } from "../services/authApi.js";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, status, login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(typeof location.state?.email === "string" ? location.state.email : "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  // Chỉ quay về các trang nội bộ đã biết, không nhận URL ngoài từ đầu vào.
  const destination = ["/account", "/admin"].includes(location.state?.from) ? location.state.from : "/account";

  if (user) return <Navigate to={destination} replace />;

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (isRegister && password !== confirmation) {
      setError("Hai mật khẩu chưa khớp nhau.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("Mật khẩu quá dài. Hãy dùng mật khẩu ngắn hơn.");
      return;
    }
    setPending(true);
    try {
      if (isRegister) {
        await registerUser({ name, email, password });
        navigate("/login", { replace: true, state: { registered: true, email: email.trim(), from: destination } });
      } else {
        await login(email, password);
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Header />
      <main className="container auth-page">
        <div className="auth-story">
          <p className="eyebrow">TRAVEL MINT</p>
          <h2>Những hành trình mới<br />đang chờ bạn.</h2>
          <p>Từ một điểm đến yêu thích đến một chuyến đi đáng nhớ. Bắt đầu cùng Travel Mint.</p>
          <img src="/images/bay.svg" alt="Minh họa phong cảnh vịnh và núi xanh" width="800" height="500" />
          <Link to="/#tours">Khám phá tour <span aria-hidden="true">↗</span></Link>
        </div>
        <section className="auth-form-section" aria-labelledby="auth-title">
          <p className="section-kicker">{isRegister ? "CHÀO MỪNG BẠN" : "MỪNG BẠN TRỞ LẠI"}</p>
          <h1 id="auth-title">{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h1>
          <p className="auth-intro">{isRegister ? "Điền thông tin để tạo tài khoản của bạn." : "Đăng nhập để tiếp tục với tài khoản của bạn."}</p>
          {status === "loading" ? <p role="status">Đang kiểm tra phiên đăng nhập…</p> : <>
            {!isRegister && location.state?.registered && <p className="auth-success" role="status">Đăng ký thành công. Bạn có thể đăng nhập ngay.</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <form className="auth-form" onSubmit={submit}>
              <fieldset disabled={pending}>
                {isRegister && <label htmlFor="full-name">Họ và tên<input id="full-name" autoComplete="name" required minLength="2" maxLength="100" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên của bạn" /></label>}
                <label htmlFor="email">Email<input id="email" type="email" autoComplete="email" required maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" /></label>
                <label htmlFor="password">Mật khẩu<input id="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 10 : undefined} maxLength="72" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby={isRegister ? "password-hint" : undefined} /></label>
                {isRegister && <p className="password-hint" id="password-hint">Dùng ít nhất 10 ký tự.</p>}
                {isRegister && <label htmlFor="confirm-password">Nhập lại mật khẩu<input id="confirm-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required maxLength="72" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>}
                <label className="show-password"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />Hiện mật khẩu</label>
                <button type="submit" className="button button-primary auth-submit">{pending ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}</button>
              </fieldset>
            </form>
          </>}
          <p className="auth-switch">{isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản? "}<Link to={isRegister ? "/login" : "/register"} state={{ from: destination }}>{isRegister ? "Đăng nhập" : "Đăng ký"}</Link></p>
        </section>
      </main>
      <Footer />
    </>
  );
}
