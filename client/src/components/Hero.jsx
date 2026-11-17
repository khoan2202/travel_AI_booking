// Banner lớn ở đầu trang chủ, có 3 slide.
// - Tự chuyển slide sau mỗi SLIDE_MS mili giây, ảnh mờ dần sang ảnh mới và zoom chậm (hiệu ứng Ken Burns).
// - Tạm dừng khi rê chuột vào phần chữ/nút chấm, khi focus vào banner, hoặc khi bấm nút tạm dừng.
// - Hiệu ứng 3D: bưu thiếp lơ lửng (HeroPostcards) và cả cảnh nghiêng theo chuột, ảnh nền trôi ngược chiều.
// - Người dùng bật "giảm chuyển động" thì không tự chạy và không nghiêng.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import HeroPostcards from "./HeroPostcards.jsx";

// Thời gian mỗi slide (ms). Thanh tiến độ trong nút chấm dùng đúng giá trị này.
const SLIDE_MS = 6500;

// Nội dung từng slide. Ảnh nằm trong client/public/images/hero/.
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

// onPickDestination: hàm do trang chủ truyền vào, gọi khi bấm một tấm bưu thiếp.
export default function Hero({ onPickDestination }) {
  const heroRef = useRef(null);
  // Thứ tự slide đang hiển thị (0, 1, 2).
  const [activeSlide, setActiveSlide] = useState(0);
  // paused: người dùng bấm tạm dừng; hovering: chuột hoặc focus đang ở trong banner.
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reduceMotion] = useState(
    () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  );
  const slide = slides[activeSlide];
  const autoplay = !reduceMotion;
  const playing = autoplay && !paused && !hovering;

  // Thanh tiến độ chạy hết (animation CSS kết thúc) thì sang slide kế tiếp.
  // Dùng animation để thanh tiến độ và việc chuyển slide luôn khớp nhau, kể cả khi tạm dừng giữa chừng.
  const next = () => setActiveSlide((index) => (index + 1) % slides.length);

  // Nghiêng 3D theo chuột: đổi vị trí chuột thành --tx, --ty (từ -1 đến 1) trên thẻ section.
  // Giá trị được "đuổi theo" dần mỗi khung hình (lerp) nên chuyển động mềm, không giật.
  // Ghi thẳng biến CSS lên DOM, không dùng state, để không phải vẽ lại React 60 lần mỗi giây.
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

  // Chỉ tạm dừng khi chuột ở phần chữ hoặc nút chấm (rê chuột lên bưu thiếp vẫn tự chuyển slide).
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
      {/* Các ảnh nền xếp chồng lên nhau; ảnh đang chọn hiện rõ, ảnh khác mờ đi */}
      <div className="hero-slides" aria-hidden="true">
        {slides.map((item, index) => (
          <div
            key={item.image}
            className={index === activeSlide ? "hero-slide is-active" : "hero-slide"}
            style={{ backgroundImage: `url(${item.image})` }}
          />
        ))}
      </div>

      {/* Lớp phủ tối giúp chữ dễ đọc, thêm vệt sáng màu mint và lớp "hạt" như ảnh phim */}
      <div className="hero-shade" />
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      {/* Bưu thiếp 3D lơ lửng hai bên chữ */}
      <HeroPostcards onPick={onPickDestination} />

      {/* key đổi theo slide nên nội dung được tạo lại, hiệu ứng chữ chạy lại mỗi lần đổi slide */}
      <div className="container hero-content" key={activeSlide} aria-live={playing ? "off" : "polite"} {...pauseHandlers}>
        <p className="eyebrow hero-line">{slide.label}</p>
        <h1 className="hero-line">{slide.title}</h1>
        <p className="hero-description hero-line">{slide.description}</p>

        <div className="hero-actions hero-line">
          <a href="#tours" className="button button-primary">
            Khám phá tour <span aria-hidden="true">↗</span>
          </a>
          {/* Lối vào quiz: dành cho khách chưa biết nên đi đâu */}
          <Link to="/quiz" className="button button-ghost">
            Chưa biết đi đâu? Làm quiz 1 phút
          </Link>
        </div>
      </div>

      {/* Nút chấm cho từng slide; chấm đang chọn có thanh tiến độ */}
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
            {/* Icon vẽ bằng CSS: hai vạch = tạm dừng, tam giác = tiếp tục */}
            <span className={paused ? "pause-icon is-play" : "pause-icon"} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
