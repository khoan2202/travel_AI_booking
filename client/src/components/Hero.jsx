// Banner lớn ở đầu trang chủ, có 3 slide; bấm các nút nhỏ phía dưới để đổi slide.
import { useState } from "react";

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
  const slide = slides[activeSlide];

  return (
    <section
      className="hero"
      aria-label="Cảm hứng du lịch"
      style={{ backgroundImage: `url(${slide.image})` }}
    >
      {/* Lớp phủ tối giúp chữ dễ đọc trên nền ảnh */}
      <div className="hero-shade" />

      <div className="container hero-content">
        <p className="eyebrow">{slide.label}</p>
        <h1>{slide.title}</h1>
        <p className="hero-description">{slide.description}</p>

        <a href="#tours" className="button button-primary">
          Khám phá tour <span aria-hidden="true">↗</span>
        </a>
      </div>

      {/* Mỗi slide có một nút chuyển */}
      <div className="slide-controls" aria-label="Chọn banner">
        {slides.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-label={`Banner ${index + 1}: ${item.title}`}
            aria-pressed={activeSlide === index}
            onClick={() => setActiveSlide(index)}
          >
            <span />
          </button>
        ))}
      </div>
    </section>
  );
}