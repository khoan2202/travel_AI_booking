import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../context/AuthContext.js";
import { getMyBookings } from "../services/bookingApi.js";
import { sendSupportRequest } from "../services/supportApi.js";
import "../styles/contact.css";

// Điền thông tin liên hệ thật vào đây khi có.
// Để trống thì không hiển thị liên kết đó.
const CONTACT = {
  facebook: "",
  email: "",
  phone: "",
};

function ContactForm({ user }) {
  const userId = user?.id ?? null;
  const sendingRef = useRef(false);

  const [form, setForm] = useState({
    full_name: user?.name ?? "",
    phone: "",
    booking_id: "",
    message: "",
  });

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(Boolean(userId));
  const [bookingError, setBookingError] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    async function loadBookings() {
      try {
        const first = await getMyBookings(1, controller.signal);
        const items = [...first.items];

        // Lấy đủ các trang đơn đặt tour của tài khoản hiện tại.
        for (let page = 2; page <= first.total_pages; page += 1) {
          if (controller.signal.aborted) return;
          const result = await getMyBookings(page, controller.signal);
          items.push(...result.items);
        }

        if (!controller.signal.aborted) {
          setBookings(items);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setBookingError(
            err.message || "Chưa tải được danh sách đơn đặt tour.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingBookings(false);
        }
      }
    }

    loadBookings();
    return () => controller.abort();
  }, [userId]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (sendingRef.current) return;

    setError("");
    setSuccess("");

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim().replace(/[\s.-]/g, ""),
      booking_id: form.booking_id ? Number(form.booking_id) : null,
      message: form.message.trim(),
    };

    if (
      [...payload.full_name].length < 2 ||
      [...payload.full_name].length > 100
    ) {
      setError("Họ tên cần có từ 2 đến 100 ký tự.");
      return;
    }

    if (!/^\+?[0-9]{9,15}$/.test(payload.phone)) {
      setError("Số điện thoại cần có từ 9 đến 15 chữ số.");
      return;
    }

    if (
      [...payload.message].length < 10 ||
      [...payload.message].length > 3000
    ) {
      setError("Nội dung cần có từ 10 đến 3000 ký tự.");
      return;
    }

    sendingRef.current = true;
    setSending(true);

    try {
      await sendSupportRequest(payload);

      setSuccess(
        "Đã gửi yêu cầu thành công. Chúng tôi sẽ liên hệ lại qua số điện thoại bạn cung cấp.",
      );
      setForm((current) => ({
        ...current,
        booking_id: "",
        message: "",
      }));
    } catch (err) {
      // Không xóa nội dung khi gửi thất bại.
      setError(err.message || "Chưa gửi được yêu cầu. Vui lòng thử lại.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} aria-busy={sending}>
      <h2>Gửi lời nhắn cho chúng tôi</h2>
      <p className="contact-muted">Các trường có dấu * là bắt buộc.</p>

      <fieldset disabled={sending}>
        <legend className="contact-sr-only">Thông tin yêu cầu hỗ trợ</legend>

        <div className="contact-fields">
          <div className="contact-field">
            <label htmlFor="contact-name">Họ và tên *</label>
            <input
              id="contact-name"
              name="full_name"
              autoComplete="name"
              required
              maxLength={100}
              value={form.full_name}
              onChange={handleChange}
              placeholder="Nhập họ và tên"
            />
          </div>

          <div className="contact-field">
            <label htmlFor="contact-phone">Số điện thoại *</label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              maxLength={30}
              value={form.phone}
              onChange={handleChange}
              placeholder="Số điện thoại để liên hệ lại"
            />
          </div>
        </div>

        <div className="contact-field">
          <label htmlFor="contact-booking">Tour đã đặt</label>
          <select
            id="contact-booking"
            name="booking_id"
            value={form.booking_id}
            onChange={handleChange}
            disabled={!userId || loadingBookings || Boolean(bookingError)}
            aria-describedby="contact-booking-note"
          >
            <option value="">Hỗ trợ chung / Chưa đặt tour</option>
            {bookings.map((booking) => (
              <option key={booking.id} value={booking.id}>
                #{booking.id} — {booking.tour_title}
              </option>
            ))}
          </select>

          <p id="contact-booking-note" className="contact-muted">
            {!userId ? (
              <>
                Bạn vẫn có thể gửi hỗ trợ chung.{" "}
                <Link to="/login">Đăng nhập</Link> để chọn tour đã đặt.
              </>
            ) : loadingBookings ? (
              "Đang tải các đơn đặt tour…"
            ) : bookingError ? (
              "Chưa tải được đơn đặt tour. Bạn vẫn có thể gửi hỗ trợ chung."
            ) : (
              "Không bắt buộc chọn tour khi gửi phản hồi."
            )}
          </p>
        </div>

        <div className="contact-field">
          <label htmlFor="contact-message">Nội dung phản hồi *</label>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            required
            maxLength={3000}
            value={form.message}
            onChange={handleChange}
            aria-describedby="contact-message-note"
            placeholder="Chia sẻ câu hỏi, yêu cầu hỗ trợ hoặc đánh giá của bạn…"
          />
          <p id="contact-message-note" className="contact-muted">
            Từ 10 đến 3.000 ký tự.
          </p>
        </div>

        <button className="contact-submit" type="submit">
          {sending ? "Đang gửi yêu cầu…" : "Xác nhận gửi"}
          <span aria-hidden="true">↗</span>
        </button>
      </fieldset>

      {error && (
        <p className="contact-feedback contact-feedback--error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="contact-feedback contact-feedback--success" role="status">
          {success}
        </p>
      )}
    </form>
  );
}

export default function ContactPage() {
  const { user, status } = useAuth();
  const hasContacts = CONTACT.facebook || CONTACT.email || CONTACT.phone;

  return (
    <>
      <Header />

      <main className="contact-page">
        <div className="contact-wrap">
          <div className="contact-heading">
            <p className="contact-kicker">TRAVEL MINT · LUÔN LẮNG NGHE</p>
            <h1>Liên hệ &amp; Hỗ trợ</h1>
            <p>
              Mỗi hành trình đều đáng nhớ. Hãy để chúng tôi giúp bạn giải đáp
              những điều còn băn khoăn.
            </p>
          </div>

          <div className="contact-layout">
            <aside className="contact-intro">
              <span className="contact-intro-icon" aria-hidden="true">✦</span>
              <h2>Chúng tôi có thể giúp gì cho bạn?</h2>
              <p>
                Gửi câu hỏi về tour, thông tin đặt chỗ hoặc chia sẻ trải nghiệm
                sau chuyến đi.
              </p>
              <ul>
                <li>Hỗ trợ thông tin tour và đơn đặt chỗ</li>
                <li>Tiếp nhận góp ý, phản hồi và đánh giá</li>
                <li>Liên hệ lại qua số điện thoại bạn cung cấp</li>
              </ul>
              <p className="contact-intro-note">
                Bạn chưa đặt tour? Vẫn có thể gửi lời nhắn cho chúng tôi.
              </p>
            </aside>

            {status === "loading" ? (
              <div className="contact-form" role="status">
                Đang tải biểu mẫu…
              </div>
            ) : (
              <ContactForm key={user?.id ?? "guest"} user={user} />
            )}
          </div>

          {hasContacts && (
            <section className="contact-channels" aria-label="Liên hệ trực tiếp">
              <h2>Kết nối với Travel Mint</h2>
              <div className="contact-channel-list">
                {CONTACT.facebook && (
                  <a href={CONTACT.facebook} target="_blank" rel="noopener noreferrer">
                    <span aria-hidden="true">f</span> Facebook
                  </a>
                )}
                {CONTACT.email && (
                  <a href={`mailto:${CONTACT.email}`}>
                    <span aria-hidden="true">✉</span> Email
                  </a>
                )}
                {CONTACT.phone && (
                  <a href={`tel:${CONTACT.phone.replace(/[\s.-]/g, "")}`}>
                    <span aria-hidden="true">☎</span> {CONTACT.phone}
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}