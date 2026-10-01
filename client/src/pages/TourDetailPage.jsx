import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import TourImage from "../components/TourImage.jsx";
import DeparturePicker from "../components/DeparturePicker.jsx";
import { getTourById, getTourDepartures } from "../services/tourApi.js";

function TourDetailContent({ id }) {
  const [tour, setTour] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadDetail() {
      try {
        const [tourData, departuresData] = await Promise.all([
          getTourById(id, controller.signal),
          getTourDepartures(id, controller.signal),
        ]);
        if (active) {
          setTour(tourData);
          setDepartures(departuresData);
          setStatus("success");
        }
      } catch (err) {
        if (active && err.name !== "AbortError") {
          setError(err.message);
          setStatus([400, 404].includes(err.status) ? "not-found" : "error");
        }
      }
    }

    loadDetail();
    return () => {
      active = false;
      controller.abort();
    };
  }, [id, retryCount]);

  function retry() {
    setStatus("loading");
    setError("");
    setRetryCount((count) => count + 1);
  }

  if (status !== "success") {
    return (
      <main className="container detail-state" id="main-content">
        {status === "loading" ? <p role="status">Đang tải thông tin tour và lịch khởi hành…</p> : <>
          <h1>{status === "not-found" ? "Không tìm thấy tour" : "Chưa tải được thông tin tour"}</h1>
          <p role="alert">{error}</p>
          <div className="detail-state-actions">
            {status === "error" && <button className="button button-primary" type="button" onClick={retry}>Thử lại</button>}
            <Link className="button button-secondary" to="/#tours">Về danh sách tour</Link>
          </div>
        </>}
      </main>
    );
  }

  return (
    <main className="container tour-detail-page" id="main-content">
      <nav className="breadcrumbs" aria-label="Đường dẫn trang">
        <Link to="/">Trang chủ</Link><span aria-hidden="true">/</span>
        <Link to="/#tours">Tour du lịch</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{tour.destination}</span>
      </nav>
      <div className="detail-title">
        <p className="section-kicker">{tour.region} · {tour.destination}</p>
        <h1>{tour.title}</h1>
        <p>{tour.duration_days} ngày <span aria-hidden="true">·</span> Khởi hành từ {tour.departure_location}</p>
      </div>
      <div className="tour-detail-layout">
        <div className="tour-main-column">
          <TourImage key={tour.image_url || "illustration"} tour={tour} />
          <div className="tour-facts">
            <div><span>Điểm đến</span><strong>{tour.destination}</strong></div>
            <div><span>Thời gian</span><strong>{tour.duration_days} ngày</strong></div>
            <div><span>Nơi khởi hành</span><strong>{tour.departure_location}</strong></div>
          </div>
          <section className="tour-overview" aria-labelledby="overview-heading">
            <p className="section-kicker">MỘT CHUYẾN ĐI ĐÁNG NHỚ</p>
            <h2 id="overview-heading">Giới thiệu hành trình</h2>
            <p className="tour-description">{tour.description}</p>
            <div className="tour-tags">{(tour.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</div>
          </section>
          <div className="detail-help"><h3>Lên kế hoạch cho chuyến đi</h3><p>Chọn lịch khởi hành còn chỗ và số người để xem chi phí dự kiến. Mỗi đợt khởi hành có thể có mức giá khác nhau.</p><Link to="/#tours">Khám phá các tour khác <span aria-hidden="true">→</span></Link></div>
        </div>
        <DeparturePicker key={tour.id} tourId={tour.id} initialDepartures={departures} />
      </div>
    </main>
  );
}

export default function TourDetailPage() {
  const { id } = useParams();
  // Đổi tour sẽ tạo một component mới, tránh giữ lựa chọn của tour trước.
  return (
    <div id="top">
      <a href="#main-content" className="skip-link">Đến nội dung chính</a>
      <Header />
      <TourDetailContent key={id} id={id} />
      <Footer />
    </div>
  );
}
