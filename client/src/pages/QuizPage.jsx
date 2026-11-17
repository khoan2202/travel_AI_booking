// Trang Quiz tìm chuyến đi (/quiz): 6 câu hỏi nhanh -> 3 tour hợp nhất kèm % phù hợp và lý do.
// - Không cần đăng nhập, không gọi AI: chấm điểm trên trình duyệt (xem utils/quiz.js).
// - Chọn đáp án là tự sang câu kế; có nút quay lại; bấm phím số 1–5 để chọn nhanh.
// - Kết quả có nút "So sánh 3 tour này" nối sang trang so sánh.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import TourImage from "../components/TourImage.jsx";
import { getTours } from "../services/tourApi.js";
import { QUESTIONS, scoreTours } from "../utils/quiz.js";
import { formatPrice } from "../utils/format.js";
import { useCompare } from "../context/CompareContext.js";

// Vòng tròn % phù hợp: vẽ bằng SVG, vòng chạy từ 0 tới đúng % khi hiện ra.
function MatchRing({ value }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <span className="match-ring" style={{ "--offset": c * (1 - value / 100), "--circ": c }} aria-label={`Phù hợp ${value}%`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <circle className="match-track" cx="32" cy="32" r={r} />
        <circle className="match-value" cx="32" cy="32" r={r} strokeDasharray={c} />
      </svg>
      <b aria-hidden="true">{value}<small>%</small></b>
    </span>
  );
}

export default function QuizPage() {
  const navigate = useNavigate();
  const { replace } = useCompare();
  // step: -1 = màn mở đầu, 0..5 = câu hỏi, 6 = kết quả
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState({});
  // Hướng chuyển câu để chọn hiệu ứng trượt sang trái hay phải
  const [direction, setDirection] = useState("next");
  const [tours, setTours] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const advancing = useRef(false);

  // Tải danh sách tour ngay khi mở trang, để lúc làm xong là có kết quả luôn.
  useEffect(() => {
    const controller = new AbortController();
    getTours(controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setTours(data); setError(""); } })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [retry]);

  const total = QUESTIONS.length;
  const done = step >= total;
  const question = QUESTIONS[step];

  // Chọn đáp án: lưu lại, chờ một nhịp ngắn cho hiệu ứng "đã chọn" rồi sang câu kế.
  // advancing chặn bấm đúp làm nhảy cóc 2 câu trong lúc đang chờ chuyển.
  function choose(value) {
    if (advancing.current) return;
    advancing.current = true;
    setAnswers((current) => ({ ...current, [question.id]: value }));
    setDirection("next");
    setTimeout(() => { setStep((s) => s + 1); advancing.current = false; }, 260);
  }
  function back() { setDirection("back"); setStep((s) => Math.max(-1, s - 1)); }
  function restart() { setAnswers({}); setDirection("next"); setStep(0); }

  // Phím số 1..n để chọn nhanh đáp án của câu đang hiện.
  useEffect(() => {
    if (!question) return;
    function onKey(event) {
      const index = Number(event.key) - 1;
      if (event.target.closest?.("input, textarea, select")) return;
      if (index >= 0 && index < question.options.length) choose(question.options[index].value);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // choose dùng question hiện tại; chỉ cần gắn lại khi đổi câu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Chỉ chấm điểm khi đã làm xong và có dữ liệu tour.
  const results = useMemo(
    () => (done && tours ? scoreTours(tours, answers).slice(0, 3) : []),
    [done, tours, answers],
  );

  // So sánh 3 tour kết quả: thay danh sách so sánh rồi mở trang so sánh.
  function compareResults() {
    replace(results.map((r) => r.tour));
    navigate(`/compare?ids=${results.map((r) => r.tour.id).join(",")}`);
  }

  return (
    <><Header />
      <main className="quiz-page">
        <div className="quiz-glow" aria-hidden="true" />
        <div className="container quiz-wrap">
          {/* Màn mở đầu */}
          {step === -1 && (
            <section className="quiz-intro quiz-anim-next" aria-labelledby="quiz-title">
              <p className="section-kicker">TRAVEL MINT · QUIZ 1 PHÚT</p>
              <h1 id="quiz-title">Chuyến đi nào<br />đang chờ bạn?</h1>
              <p className="quiz-lead">Trả lời 6 câu hỏi nhanh, chúng tôi chọn ra 3 hành trình hợp với bạn nhất, kèm lý do rõ ràng. Không cần đăng nhập.</p>
              <div className="quiz-intro-icons" aria-hidden="true">{["🌊", "⛰️", "🏮", "🛶", "🍜", "📸"].map((icon, i) => <span key={icon} style={{ "--i": i }}>{icon}</span>)}</div>
              <button type="button" className="button button-primary quiz-start" onClick={() => setStep(0)}>Bắt đầu ngay <span aria-hidden="true">→</span></button>
            </section>
          )}

          {/* Câu hỏi: key theo câu để hiệu ứng trượt chạy lại mỗi lần đổi câu */}
          {question && (
            <section className={`quiz-card quiz-anim-${direction}`} key={step} aria-labelledby="quiz-question">
              <div className="quiz-progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1} aria-label="Tiến độ quiz">
                <span style={{ width: `${((step + 1) / total) * 100}%` }} />
              </div>
              <div className="quiz-meta">
                <button type="button" className="quiz-back" onClick={back}><span aria-hidden="true">←</span> Quay lại</button>
                <span>Câu {step + 1}/{total}</span>
              </div>
              <h2 id="quiz-question">{question.title}</h2>
              <p className="quiz-hint">{question.hint}</p>
              <div className="quiz-options" role="group" aria-labelledby="quiz-question">
                {question.options.map((option, i) => (
                  <button
                    type="button"
                    key={option.value}
                    className={answers[question.id] === option.value ? "quiz-option is-chosen" : "quiz-option"}
                    style={{ "--i": i }}
                    onClick={() => choose(option.value)}
                    aria-pressed={answers[question.id] === option.value}
                  >
                    <span className="quiz-icon" aria-hidden="true">{option.icon}</span>
                    <span className="quiz-label">{option.label}</span>
                    <kbd aria-hidden="true">{i + 1}</kbd>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Kết quả */}
          {done && (
            <section className="quiz-result quiz-anim-next" aria-labelledby="quiz-result-title">
              <p className="section-kicker">KẾT QUẢ CỦA BẠN</p>
              <h1 id="quiz-result-title">3 hành trình hợp với bạn nhất</h1>
              {/* Tóm tắt các lựa chọn của khách */}
              <ul className="quiz-chips">
                {QUESTIONS.map((q) => {
                  const option = q.options.find((o) => o.value === answers[q.id]);
                  return option ? <li key={q.id}><span aria-hidden="true">{option.icon}</span> {option.label}</li> : null;
                })}
              </ul>

              {error && <div className="state-box" role="alert"><p>{error}</p><button type="button" className="button button-primary" onClick={() => setRetry((n) => n + 1)}>Thử lại</button></div>}
              {!error && !tours && <p role="status">Đang chọn tour cho bạn…</p>}
              {tours && results.length === 0 && <div className="state-box"><p>Hiện chưa có tour đang mở bán. Bạn quay lại sau nhé.</p></div>}

              <div className="quiz-results">
                {results.map(({ tour, score, reasons }, i) => (
                  <article className="quiz-pick" key={tour.id} style={{ "--i": i }}>
                    <div className="quiz-pick-media">
                      <TourImage tour={tour} />
                      {i === 0 && <span className="quiz-top">Hợp nhất</span>}
                    </div>
                    <div className="quiz-pick-body">
                      <div className="quiz-pick-head">
                        <div>
                          <p className="tour-destination">{tour.destination} · {tour.region}</p>
                          <h3><Link to={`/tours/${tour.id}`}>{tour.title}</Link></h3>
                        </div>
                        <MatchRing value={score} />
                      </div>
                      {reasons.length > 0 && (
                        <ul className="quiz-reasons">
                          {reasons.map((reason) => <li key={reason}>{reason}</li>)}
                        </ul>
                      )}
                      <div className="quiz-pick-foot">
                        <p><span className="price-label">Giá từ / người</span><strong>{formatPrice(tour.price_from)}</strong></p>
                        <Link className="button button-secondary" to={`/tours/${tour.id}`}>Xem tour <span aria-hidden="true">↗</span></Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="quiz-actions">
                {results.length >= 2 && <button type="button" className="button button-primary" onClick={compareResults}>So sánh {results.length} tour này <span aria-hidden="true">⇄</span></button>}
                <button type="button" className="button button-secondary" onClick={restart}>Làm lại quiz</button>
                <Link className="button button-secondary" to="/#tours">Xem tất cả tour</Link>
              </div>
            </section>
          )}
        </div>
      </main>
    <Footer /></>
  );
}
