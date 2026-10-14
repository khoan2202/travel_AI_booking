import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.js";
import { registerUser } from "../services/authApi.js";
import { safeAuthRedirect } from "../utils/authRedirect.js";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, status, login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(
    typeof location.state?.email === "string"
      ? location.state.email
      : ""
  );

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  // Chỉ quay về các trang nội bộ đã biết,
  // không nhận URL ngoài từ đầu vào.
  const destination = safeAuthRedirect(location.state?.from);

  // Ảnh nền khác nhau cho Login và Register
  const backgroundImage = isRegister
    ? "/images/auth_login_register/register.jpg"
    : "/images/auth_login_register/login.jpg";
  if (user) {
    return <Navigate to={destination} replace />;
  }
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
        await registerUser({
          name,
          email,
          password,
        });
        navigate("/login", {
          replace: true,
          state: {
            registered: true,
            email: email.trim(),
            from: destination,
          },
        });
      } else {
        await login(email, password);
        navigate(destination, {
          replace: true,
        });
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
      <main
        className="auth-modern"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        {/* lớp tối phủ lên ảnh nền */}
        <div className="auth-modern-overlay" />
        <div className="auth-modern-container">
          {/* ============================= */}
          {/* BÊN TRÁI - NỘI DUNG GIỚI THIỆU */}
          {/* ============================= */}
          <section className="auth-modern-story">
            <p className="auth-modern-kicker">
              {isRegister ? "THAM GIA MIỄN PHÍ" : "TRAVEL MINT"}
            </p>
            <h1 className="auth-modern-title">
              {isRegister ? (
                <>
                  Khám phá thế giới,
                  <br />
                  theo cách <span>của bạn.</span>
                </>
              ) : (
                <>
                  Những hành trình mới
                  <br />
                  đang <span>chờ bạn.</span>
                </>
              )}
            </h1>
            <p className="auth-modern-description">
              {isRegister
                ? "Tạo tài khoản và bắt đầu khám phá những hành trình đáng nhớ cùng Travel Mint."
                : "Từ một điểm đến yêu thích đến một chuyến đi đáng nhớ. Tiếp tục hành trình của bạn cùng Travel Mint."}
            </p>
            {/* <div className="auth-modern-actions">
              <Link
                to="/#tours"
                className="auth-modern-button auth-modern-button-outline"
              >
                Khám phá tour
              </Link>
              <Link
                to="/recommendations"
                className="auth-modern-button auth-modern-button-primary"
              >
                Tư vấn AI
              </Link>
            </div> */}
          </section>
          {/* ============================= */}
          {/* BÊN PHẢI - FORM */}
          {/* ============================= */}
          <section
            className="auth-modern-card"
            aria-labelledby="auth-title"
          >
            <p className="auth-modern-card-kicker">
              {isRegister ? "CHÀO MỪNG BẠN" : "MỪNG BẠN TRỞ LẠI"}
            </p>

            <h2 id="auth-title" className="auth-modern-card-title">
              {isRegister ? "Tạo tài khoản." : "Đăng nhập."}
            </h2>
            <p className="auth-modern-card-intro">
              {isRegister
                ? "Điền thông tin bên dưới để bắt đầu hành trình của bạn."
                : "Đăng nhập để tiếp tục với tài khoản Travel Mint."}
            </p>
            {status === "loading" ? (
              <p role="status">Đang kiểm tra phiên đăng nhập…</p>
            ) : (
              <>
                {!isRegister && location.state?.registered && (
                  <p
                    className="auth-success"
                    role="status"
                  >
                    Đăng ký thành công. Bạn có thể đăng nhập ngay.
                  </p>
                )}
                {error && (
                  <p
                    className="auth-error"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
                <form
                  className="auth-form auth-modern-form"
                  onSubmit={submit}
                >
                  <fieldset disabled={pending}>
                    {isRegister && (
                      <label htmlFor="full-name">
                        Họ và tên
                        <input
                          id="full-name"
                          autoComplete="name"
                          required
                          minLength="2"
                          maxLength="100"
                          value={name}
                          onChange={(event) =>
                            setName(event.target.value)
                          }
                          placeholder="Tên của bạn"
                        />
                      </label>
                    )}
                    <label htmlFor="email">
                      Email
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength="254"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="ban@example.com"
                      />
                    </label>
                    <label htmlFor="password">
                      Mật khẩu
                      <input
                        id="password"
                        type={
                          showPassword
                            ? "text": "password"
                        }
                        autoComplete={
                          isRegister
                            ? "new-password": "current-password"
                        }
                        required
                        minLength={
                          isRegister
                            ? 10 : undefined
                        }
                        maxLength="72"
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        aria-describedby={
                          isRegister
                            ? "password-hint": undefined
                        }
                      />
                    </label>
                    {isRegister && (
                      <p
                        className="password-hint"
                        id="password-hint"
                      >
                        Dùng ít nhất 10 ký tự.
                      </p>
                    )}
                    {isRegister && (
                      <label htmlFor="confirm-password">
                        Nhập lại mật khẩu
                        <input
                          id="confirm-password"
                          type={
                            showPassword
                              ? "text" : "password"
                          }
                          autoComplete="new-password"
                          required
                          maxLength="72"
                          value={confirmation}
                          onChange={(event) =>
                            setConfirmation(
                              event.target.value
                            )
                          }
                        />
                      </label>
                    )}
                    <label className="show-password auth-modern-show-password">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(event) =>
                          setShowPassword(
                            event.target.checked
                          )
                        }
                      />
                      <span>Hiện mật khẩu</span>
                    </label>
                    <button
                      type="submit"
                      className="button button-primary auth-submit auth-modern-submit"
                    >
                      {pending
                        ? "Đang xử lý…"
                        : isRegister
                          ? "Tạo tài khoản": "Đăng nhập"}
                    </button>
                  </fieldset>
                </form>
              </>
            )}
            <p className="auth-switch auth-modern-switch">
              {isRegister
                ? "Đã có tài khoản? ": "Chưa có tài khoản? "}
              <Link
                to={
                  isRegister
                    ? "/login": "/register"
                }
                state={{
                  from: destination,
                }}
              >
                {isRegister
                  ? "Đăng nhập": "Đăng ký"}
              </Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}