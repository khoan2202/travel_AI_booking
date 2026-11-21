// Banner đầu trang chủ, 3 slide tự chuyển sau mỗi SLIDE_MS (ảnh mờ dần sang ảnh mới, zoom chậm kiểu Ken Burns).
// Tạm dừng khi rê chuột vào chữ hoặc nút chấm, khi focus vào banner, hoặc khi bấm nút tạm dừng.
// Bản 3D: bưu thiếp lơ lửng (HeroPostcards), cả cảnh nghiêng theo chuột, ảnh nền trôi ngược chiều.
// Ai bật "giảm chuyển động" trên máy thì không tự chạy và không nghiêng.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import HeroPostcards from "./HeroPostcards.jsx";

// thời gian mỗi slide, thanh tiến độ trong nút chấm cũng dùng đúng số này
const SLIDE_MS = 6500;

// nội dung từng slide, ảnh ở client/public/images/hero/
const slides = [
  {
    label: "ĐI ĐỂ CÓ THÊM NHỮNG CÂU CHUYỆN",
    title: "Hẹn một chuyến đi.",
    description:
      "Từ miền núi xanh đến những bờ biển đầy nắng. Tìm hành trình dành cho bạn.",
    image: "/images/hero/hero-1.jpg",
  },
  {
    label: "MỘT CHÚT NẮNG, MỘT CHÚT BIỂN",
    title: "Chạm vào mùa hè.",
    description:
      "Đổi nhịp sống thường ngày bằng một hành trình về phía biển.",
    image: "/images/hero/hero-2.jpg",
  },
  {
    label: "NHỮNG ĐIỀU ĐẸP ĐẼ ĐANG CHỜ",
    title: "Khám phá Việt Nam.",
    description:
      "Chọn điểm đến, xem giá và tìm chuyến đi phù hợp với bạn.",
    image: "/images/hero/hero-3.jpg",
  },
];

// onPickDestination do trang chủ truyền vào, gọi khi bấm một tấm bưu thiếp
export default function Hero({ onPickDestination }) {
  const heroRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  // paused: khách bấm tạm dừng; hovering: chuột hoặc focus đang ở trong banner
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reduceMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  const slide = slides[activeSlide];
  const autoplay = !reduceMotion;
  const playing = autoplay && !paused && !hovering;

  // thanh tiến độ chạy hết (animation CSS kết thúc) thì sang slide kế.
  // dựa vào animation để thanh và việc chuyển slide luôn khớp nhau, kể cả khi tạm dừng giữa chừng
  const next = () => setActiveSlide((index) => (index + 1) % slides.length);

  // nghiêng 3D theo chuột: đổi vị trí chuột thành --tx, --ty (-1 tới 1) trên thẻ section.
  // mỗi khung hình đuổi dần tới giá trị đích (lerp) cho mượt, và ghi thẳng biến CSS thay vì dùng state
  // để React không phải vẽ lại 60 lần mỗi giây
  useEffect(() => {
    const hero = heroRef.current;
    const canHover = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
    if (!hero || reduceMotion || !canHover) return;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    function tick() {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      hero.style.setProperty("--tx", current.x.toFixed(4));
      hero.style.setProperty("--ty", current.y.toFixed(4));
      const settled = Math.abs(target.x - current.x) < 0.001 && Math.abs(target.y - current.y) < 0.001;
      frame = settled ? 0 : requestAnimationFrame(tick);
    }
    const start = () => { if (!frame) frame = requestAnimationFrame(tick); };
    function onMove(event) {
      const box = hero.getBoundingClientRect();
      target.x = ((event.clientX - box.left) / box.width) * 2 - 1;
      target.y = ((event.clientY - box.top) / box.height) * 2 - 1;
      start();
    }
    function onLeave() { target.x = 0; target.y = 0; start(); }
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  // chỉ dừng khi chuột ở chữ hoặc nút chấm, rê lên bưu thiếp thì slide vẫn chạy
  const pauseHandlers = { onMouseEnter: () => setHovering(true), onMouseLeave: () => setHovering(false) };

  return (
    <section
      ref={heroRef}
      className="hero"
      aria-roledescription="carousel"
      aria-label="Cảm hứng du lịch"
      data-playing={playing}
      style={{ "--slide-ms": `${SLIDE_MS}ms` }}
      onFocus={() => setHovering(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovering(false); }}
    >
      {/* ảnh nền xếp chồng, ảnh đang chọn hiện rõ còn lại mờ đi */}
      <div className="hero-slides" aria-hidden="true">
        {slides.map((item, index) => (
          <div
            key={item.image}
            className={index === activeSlide ? "hero-slide is-active" : "hero-slide"}
            style={{ backgroundImage: `url(${item.image})` }}
          />
        ))}
      </div>

      {/* lớp tối cho chữ dễ đọc, thêm vệt sáng mint và lớp "hạt" kiểu ảnh phim */}
      <div className="hero-shade" />
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <HeroPostcards onPick={onPickDestination} />

      {/* key theo slide để chữ được tạo lại và hiệu ứng chạy lại mỗi lần đổi */}
      <div className="container hero-content" key={activeSlide} aria-live={playing ? "off" : "polite"} {...pauseHandlers}>
        <p className="eyebrow hero-line">{slide.label}</p>
        <h1 className="hero-line">{slide.title}</h1>
        <p className="hero-description hero-line">{slide.description}</p>

        <div className="hero-actions hero-line">
          <a href="#tours" className="button button-primary">
            Khám phá tour <span aria-hidden="true">↗</span>
          </a>
          {/* cho khách chưa biết đi đâu */}
          <Link to="/quiz" className="button button-ghost">
            Chưa biết đi đâu? Làm quiz 1 phút
          </Link>
        </div>
      </div>

      {/* chấm đang chọn có thanh tiến độ chạy bên trong */}
      <div className="slide-controls" aria-label="Chọn banner" {...pauseHandlers}>
        {slides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className="slide-dot"
            aria-label={`Banner ${index + 1}: ${item.title}`}
            aria-pressed={activeSlide === index}
            onClick={() => setActiveSlide(index)}
          >
            <span>
              {activeSlide === index && autoplay && (
                <i key={activeSlide} onAnimationEnd={next} />
              )}
            </span>
          </button>
        ))}
        {autoplay && (
          <button
            type="button"
            className="slide-pause"
            aria-label={paused ? "Tiếp tục tự chuyển banner" : "Tạm dừng tự chuyển banner"}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {/* icon vẽ bằng CSS: hai vạch là tạm dừng, tam giác là chạy tiếp */}
            <span className={paused ? "pause-icon is-play" : "pause-icon"} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
