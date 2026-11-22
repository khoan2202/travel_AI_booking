// Trang chủ: banner, điểm đến nổi bật, danh sách tour có lọc, bài blog mới, giới thiệu.
import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import TourCard from "../components/TourCard.jsx";
import Footer from "../components/Footer.jsx";
import HomeBlog from "../components/HomeBlog.jsx";
import { getTours } from "../services/tourApi.js";
import { normalizeText } from "../utils/format.js";
import { imagesFor } from "../data/destinationImages.js";

// lúc đầu hiện 9 tour, mỗi lần "Xem thêm" thêm 9
const PAGE_SIZE = 9;

// status là "loading", "success" hoặc "error"
export default function HomePage() {
  const [tours, setTours] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  // tải tour khi mở trang và khi bấm "Thử lại"
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    // 15 giây chưa xong thì báo lỗi
    const timeout = setTimeout(() => {
      if (active) {
        controller.abort();
        setError("Tải tour quá lâu. Vui lòng thử lại.");
        setStatus("error");
      }
    }, 15000);

    async function loadTours() {
      try {
        const data = await getTours(controller.signal);
        if (active) {
          setTours(data);
          setStatus("success");
        }
      } catch (err) {
        if (active && err.name !== "AbortError") {
          setError(err instanceof TypeError
            ? "Chưa kết nối được máy chủ. Vui lòng thử lại."
            : err.message);
          setStatus("error");
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    loadTours();
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [retryCount]);

  function retry() {
    setStatus("loading");
    setError("");
    setRetryCount((count) => count + 1);
  }

  function resetFilters() {
    setKeyword("");
    setRegion("");
    setMaxPrice("");
    setVisible(PAGE_SIZE);
  }

  // đổi bộ lọc thì về lại 9 tour đầu
  const changeFilter = (setter) => (event) => { setter(event.target.value); setVisible(PAGE_SIZE); };

  // bấm điểm đến nổi bật: lọc theo tên rồi cuộn xuống danh sách
  function pickDestination(name) {
    setKeyword(name);
    setRegion("");
    setMaxPrice("");
    setVisible(PAGE_SIZE);
    document.getElementById("tours")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // các khu vực (không trùng) cho ô chọn
  const regions = [...new Set(tours.map((tour) => tour.region))];
  // từ khóa không phân biệt dấu, rồi tới khu vực và giá
  const filteredTours = tours.filter((tour) => {
    const searchText = normalizeText(
      `${tour.title} ${tour.destination} ${tour.departure_location} ${(tour.tags || []).join(" ")}`
    );
    return searchText.includes(normalizeText(keyword))
      && (!region || tour.region === region)
      && (!maxPrice || Number(tour.price_from) <= Number(maxPrice));
  });

  // điểm đến nổi bật: gom tour theo điểm đến, nhiều tour nhất đứng đầu, lấy 8
  const destinations = Object.values(tours.reduce((groups, tour) => {
    const group = groups[tour.destination] || { name: tour.destination, region: tour.region, count: 0 };
    group.count += 1;
    groups[tour.destination] = group;
    return groups;
  }, {})).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi")).slice(0, 8);

  return (
    <div id="top">
      <a href="#main-content" className="skip-link">Đến nội dung chính</a>
      <Header />
      <main id="main-content">
        <Hero onPickDestination={pickDestination} />
        {/* lưới ảnh, ô đầu to nhất; bấm vào thì lọc tour theo điểm đến */}
        {destinations.length > 0 && (
          <section className="section container destination-section" aria-labelledby="destination-heading">
            <div className="section-heading">
              <div><p className="section-kicker">CẢM HỨNG CHO CHUYẾN ĐI</p><h2 id="destination-heading">Điểm đến nổi bật</h2></div>
              <span className="section-note">Chạm vào một điểm đến để xem các tour.</span>
            </div>
            <div className="destination-grid">
              {destinations.map((item) => (
                <button key={item.name} type="button" className="destination-tile" onClick={() => pickDestination(item.name)}>
                  <img src={imagesFor(item.name).cover.src} alt="" loading="lazy" decoding="async" width="640" height="420" />
                  <span className="destination-info">
                    <small>{item.region}</small>
                    <strong>{item.name}</strong>
                    <em>{item.count} tour <span aria-hidden="true">→</span></em>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <HomeBlog />

        {/* id="tours" để link /#tours cuộn tới đây */}
        <section id="tours" className="section container">
          <div className="section-heading">
            <div><p className="section-kicker">CHỌN MỘT ĐIỂM ĐẾN</p><h2>Hành trình dành cho bạn</h2></div>
            <span className="section-note">Đi gần hay đi xa, bắt đầu từ đây.</span>
          </div>
          <div className="tour-filters" role="search" aria-label="Lọc danh sách tour">
            <label className="search-field">Bạn muốn đi đâu?
              <input type="search" placeholder="Thử Đà Lạt, biển, thiên nhiên..." value={keyword} onChange={changeFilter(setKeyword)} />
            </label>
            <label>Khu vực
              <select aria-label="Khu vực" value={region} onChange={changeFilter(setRegion)}>
                <option value="">Tất cả khu vực</option>
                {regions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>Ngân sách / người
              <select aria-label="Ngân sách / người" value={maxPrice} onChange={changeFilter(setMaxPrice)}>
                <option value="">Tất cả mức giá</option>
                <option value="3000000">Đến 3.000.000 ₫</option>
                <option value="4000000">Đến 4.000.000 ₫</option>
                <option value="5000000">Đến 5.000.000 ₫</option>
              </select>
            </label>
            <button className="button button-secondary" type="button" onClick={resetFilters}>Xóa lọc</button>
          </div>

          {/* đang tải thì hiện 3 thẻ "khung xương" giống thẻ tour thật cho đỡ sốt ruột */}
          {status === "loading" && <div className="tour-grid skeleton-grid" role="status">
            <span className="sr-only">Đang tải các chuyến đi...</span>
            {[0, 1, 2].map((item) => <div className="tour-card skeleton-card" key={item} aria-hidden="true">
              <div className="skeleton-media" />
              <div className="tour-content"><div className="skeleton-line is-short" /><div className="skeleton-line is-title" /><div className="skeleton-line" /><div className="skeleton-line is-short" /></div>
            </div>)}
          </div>}
          {status === "error" && <div className="state-box error-box" role="alert"><p>{error}</p><button type="button" className="button button-primary" onClick={retry}>Thử lại</button></div>}
          {status === "success" && <>
            <p className="result-count" role="status">Tìm thấy {filteredTours.length} tour</p>
            {filteredTours.length > 0
              ? <>
                <div className="tour-grid">{filteredTours.slice(0, visible).map((tour) => <TourCard key={tour.id} tour={tour} />)}</div>
                {visible < filteredTours.length && (
                  <div className="load-more">
                    <button type="button" className="button button-secondary" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                      Xem thêm tour ({filteredTours.length - visible}) <span aria-hidden="true">↓</span>
                    </button>
                  </div>
                )}
              </>
              : <div className="state-box"><h3>{tours.length === 0 ? "Chưa có tour đang mở bán" : "Chưa tìm thấy tour phù hợp"}</h3><p>{tours.length === 0 ? "Hãy quay lại để xem những hành trình mới." : "Thử đổi điểm đến, khu vực hoặc ngân sách của bạn."}</p>{tours.length > 0 && <button type="button" className="button button-secondary" onClick={resetFilters}>Xóa bộ lọc</button>}</div>}
          </>}
        </section>

        <section id="about" className="section container about-section">
          <div className="about-art"><img src="/images/about/about.jpg" alt="Minh họa cảnh quan vịnh và những dãy núi xanh" loading="lazy" width="800" height="500" /><span>ĐI. KHÁM PHÁ. GHI NHỚ.</span></div>
          <div className="about-content"><p className="section-kicker">VỀ TRAVEL MINT</p><h2>Mỗi hành trình,<br />một câu chuyện mới.</h2><p>Một điểm đến yêu thích, một lịch trình vừa vặn và một khoảng thời gian dành cho bản thân. Chuyến đi của bạn có thể bắt đầu từ những điều đơn giản như thế.</p><p>Khám phá các tour theo điểm đến và ngân sách, rồi chọn hành trình khiến bạn muốn xách ba lô lên.</p><a href="#tours" className="button button-primary">Tìm chuyến đi của bạn <span aria-hidden="true">↗</span></a></div>
        </section>
        <div className="container"><aside className="travel-callout"><div><h2>Chuyến đi tiếp theo, bạn muốn đến đâu?</h2><p>Khám phá một miền đất mới từ những lựa chọn quen thuộc.</p></div><a className="button button-dark" href="#tours">Xem các tour</a></aside></div>
      </main>
      <Footer />
    </div>
  );
}
