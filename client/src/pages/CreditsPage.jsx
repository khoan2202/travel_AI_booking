// Trang Nguồn ảnh (/credits): ghi công tác giả và giấy phép của mọi ảnh lấy từ Wikimedia Commons.
// Ảnh CC BY / CC BY-SA bắt buộc ghi tên tác giả ở nơi người xem tìm được,
// nên trang này phủ cho mọi chỗ dùng ảnh (thẻ tour, lưới điểm đến, bưu thiếp 3D, bộ sưu tập).
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import { destinationImages } from "../data/destinationImages.js";

export default function CreditsPage() {
  // Chỉ liệt kê ảnh có thông tin tác giả (ảnh cũ trong /images/tours/ chưa rõ nguồn).
  const groups = Object.entries(destinationImages)
    .map(([name, data]) => ({ name, photos: data.gallery.filter((photo) => photo.author) }))
    .filter((group) => group.photos.length);
  const count = groups.reduce((sum, group) => sum + group.photos.length, 0);

  return (
    <><Header />
      <main className="container credits-page">
        <p className="section-kicker">CẢM ƠN CÁC NHIẾP ẢNH GIA</p>
        <h1>Nguồn ảnh</h1>
        <p className="compare-intro">
          {count} ảnh điểm đến trên Travel Mint lấy từ Wikimedia Commons theo giấy phép tự do (CC BY, CC BY-SA, CC0, Public domain).
          Ảnh trên bưu thiếp ở banner là bản thu nhỏ của các ảnh dưới đây. Bấm vào ảnh để xem trang gốc và giấy phép đầy đủ.
        </p>
        {groups.map((group) => (
          <section className="credits-group" key={group.name} aria-labelledby={`credit-${group.name}`}>
            <h2 id={`credit-${group.name}`}>{group.name}</h2>
            <ul>
              {group.photos.map((photo) => (
                <li key={photo.src}>
                  <a href={photo.source} target="_blank" rel="noopener noreferrer">
                    <img src={photo.src} alt="" loading="lazy" decoding="async" width="160" height="100" />
                    <span><strong>{photo.author}</strong><small>{photo.license}</small></span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    <Footer /></>
  );
}
