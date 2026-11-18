// Đăng nhập (/login) và đăng ký (/register) dùng chung một component, phân biệt bằng prop mode (khai báo trong App.jsx).
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
  // status là trạng thái phiên, login() lấy từ AuthProvider
  const { user, status, login } = useAuth();
  const [name, setName] = useState("");
  // vừa đăng ký xong thì điền sẵn email (gửi sang qua location.state)
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

  // chỉ quay về trang nội bộ, không bao giờ nghe theo URL ngoài
  const destination = safeAuthRedirect(location.state?.from);

  // đăng nhập và đăng ký dùng hai ảnh nền khác nhau
  const backgroundImage = isRegister
    ? "/images/auth_login_register/register.jpg"
    : "/images/auth_login_register/login.jpg";
  // đăng nhập rồi thì đi thẳng tới trang đích, không ở lại đây
  if (user) {
    return <Navigate to={destination} replace />;
  }
  async function submit(event) {
    event.preventDefault();
    setError("");
    // kiểm tra nhanh trước khi gửi: mật khẩu nhập lại phải khớp, không quá 72 byte
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
      // đăng ký xong thì sang đăng nhập, mang theo email và trang đích ban đầu
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
      // đăng nhập xong thì về trang đang xem dở (hoặc /account)
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
        {/* lớp tối phủ ảnh nền */}
        <div className="auth-modern-overlay" />
        <div className="auth-modern-container">
          {/* bên trái: lời giới thiệu */}
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
          </section>
          {/* bên phải: form */}
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
            {/* đang kiểm tra phiên thì hiện chữ chờ, xong mới hiện form */}
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
                  {/* đang gửi thì khóa hết ô nhập */}
                  <fieldset disabled={pending}>
                    {/* họ tên chỉ có ở đăng ký */}
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
                    {/* nhập lại mật khẩu cũng chỉ có ở đăng ký */}
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
            {/* chuyển qua lại đăng nhập/đăng ký mà vẫn giữ trang đích */}
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