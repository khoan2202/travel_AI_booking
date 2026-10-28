import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import TourCard from "../components/TourCard.jsx";
import Footer from "../components/Footer.jsx";
import { getTours } from "../services/tourApi.js";
import { normalizeText } from "../utils/format.js";

export default function HomePage() {
  const [tours, setTours] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
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
  }

  // Lọc danh sách đã lấy từ API. Chặng sau sẽ mở rộng lọc phía server.
  const regions = [...new Set(tours.map((tour) => tour.region))];
  const filteredTours = tours.filter((tour) => {
    const searchText = normalizeText(
      `${tour.title} ${tour.destination} ${tour.departure_location} ${(tour.tags || []).join(" ")}`
    );
    return searchText.includes(normalizeText(keyword))
      && (!region || tour.region === region)
      && (!maxPrice || Number(tour.price_from) <= Number(maxPrice));
  });

  return (
    <div id="top">
      <a href="#main-content" className="skip-link">Đến nội dung chính</a>
      <Header />
      <main id="main-content">
        <Hero />
        <section id="tours" className="section container">
          <div className="section-heading">
            <div><p className="section-kicker">CHỌN MỘT ĐIỂM ĐẾN</p><h2>Hành trình dành cho bạn</h2></div>
            <span className="section-note">Đi gần hay đi xa, bắt đầu từ đây.</span>
          </div>
          <div className="tour-filters" role="search" aria-label="Lọc danh sách tour">
            <label className="search-field">Bạn muốn đi đâu?
              <input type="search" placeholder="Thử Đà Lạt, biển, thiên nhiên..." value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </label>
            <label>Khu vực
              <select aria-label="Khu vực" value={region} onChange={(event) => setRegion(event.target.value)}>
                <option value="">Tất cả khu vực</option>
                {regions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>Ngân sách / người
              <select aria-label="Ngân sách / người" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
                <option value="">Tất cả mức giá</option>
                <option value="3000000">Đến 3.000.000 ₫</option>
                <option value="4000000">Đến 4.000.000 ₫</option>
                <option value="5000000">Đến 5.000.000 ₫</option>
              </select>
            </label>
            <button className="button button-secondary" type="button" onClick={resetFilters}>Xóa lọc</button>
          </div>

          {status === "loading" && <div className="state-box" role="status">Đang tải các chuyến đi...</div>}
          {status === "error" && <div className="state-box error-box" role="alert"><p>{error}</p><button type="button" className="button button-primary" onClick={retry}>Thử lại</button></div>}
          {status === "success" && <>
            <p className="result-count" role="status">Tìm thấy {filteredTours.length} tour</p>
            {filteredTours.length > 0
              ? <div className="tour-grid">{filteredTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}</div>
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
