// Lớp bưu thiếp 3D lơ lửng trong banner trang chủ.
// - Mỗi tấm có vị trí, độ sâu (trục Z) và góc nghiêng riêng, tự trôi nhẹ lên xuống.
// - Cả cụm nghiêng theo chuột: Hero.jsx ghi biến CSS --tx, --ty (từ -1 đến 1) lên thẻ <section>.
// - Bấm một tấm để lọc danh sách tour theo điểm đến đó.
// Ảnh bưu thiếp là bản thu nhỏ (WebP 420px) của ảnh trong /images/destinations/, nguồn ảnh xem trang /credits.

// x, y: vị trí theo % khung banner; z: độ sâu (px, số dương là gần người xem hơn);
// r: góc xoay; w: chiều rộng; dur, delay: nhịp trôi; hideSm: ẩn ở màn hình vừa cho đỡ rối.
const POSTCARDS = [
  { name: "Hội An", img: "hoi-an", x: 13, y: 33, z: 70, r: -8, w: 196, dur: 7, delay: 0 },
  { name: "Hà Giang", img: "ha-giang", x: 87, y: 27, z: 30, r: 7, w: 176, dur: 8.5, delay: -2 },
  { name: "Mũi Né", img: "mui-ne", x: 9, y: 76, z: -50, r: 5, w: 150, dur: 9, delay: -4, hideSm: true },
  { name: "Ninh Bình", img: "ninh-binh", x: 90, y: 71, z: 90, r: -6, w: 206, dur: 7.5, delay: -1 },
  { name: "Phú Quốc", img: "phu-quoc", x: 80, y: 57, z: -140, r: 4, w: 128, dur: 10, delay: -6, hideSm: true },
];

export default function HeroPostcards({ onPick }) {
  return (
    <div className="hero-scene">
      <div className="hero-stage">
        {POSTCARDS.map((card) => (
          <button
            key={card.name}
            type="button"
            className={card.hideSm ? "postcard is-optional" : "postcard"}
            style={{
              "--x": `${card.x}%`, "--y": `${card.y}%`, "--z": `${card.z}px`,
              "--r": `${card.r}deg`, "--w": `${card.w}px`,
              "--dur": `${card.dur}s`, "--delay": `${card.delay}s`,
            }}
            onClick={() => onPick?.(card.name)}
            aria-label={`Xem các tour ${card.name}`}
            tabIndex={onPick ? 0 : -1}
          >
            {/* Lớp trôi tách riêng để chuyển động trôi không đè lên vị trí và góc nghiêng */}
            <span className="postcard-float">
              <span className="postcard-photo">
                <img src={`/images/postcards/${card.img}.webp`} alt="" width="420" height="315" decoding="async" />
              </span>
              <span className="postcard-caption">{card.name}</span>
              <span className="postcard-stamp" aria-hidden="true">VN</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
