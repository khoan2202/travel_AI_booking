// Banner lớn ở đầu trang chủ, có 3 slide.
// - Tự chuyển slide sau mỗi SLIDE_MS mili giây, ảnh mờ dần sang ảnh mới và zoom chậm (hiệu ứng Ken Burns).
// - Tạm dừng khi rê chuột hoặc focus vào banner, hoặc khi bấm nút tạm dừng.
// - Người dùng bật "giảm chuyển động" thì không tự chạy.
import { useState } from "react";

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

export default function Hero() {
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

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Cảm hứng du lịch"
      data-playing={playing}
      style={{ "--slide-ms": `${SLIDE_MS}ms` }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
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

      {/* key đổi theo slide nên nội dung được tạo lại, hiệu ứng chữ chạy lại mỗi lần đổi slide */}
      <div className="container hero-content" key={activeSlide} aria-live={playing ? "off" : "polite"}>
        <p className="eyebrow hero-line">{slide.label}</p>
        <h1 className="hero-line">{slide.title}</h1>
        <p className="hero-description hero-line">{slide.description}</p>

        <a href="#tours" className="button button-primary hero-line">
          Khám phá tour <span aria-hidden="true">↗</span>
        </a>
      </div>

      {/* Nút chấm cho từng slide; chấm đang chọn có thanh tiến độ */}
      <div className="slide-controls" aria-label="Chọn banner">
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
