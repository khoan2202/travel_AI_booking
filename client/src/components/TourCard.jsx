import { useState } from "react";
import { formatPrice } from "../utils/format.js";

function TourImage({ tour }) {
  const [failed, setFailed] = useState(false);
  const mountainTour = ["Đà Lạt", "Sa Pa"].includes(tour.destination);
  const fallback = mountainTour
    ? "/images/mountains.svg"
    : tour.destination === "Hạ Long"
      ? "/images/bay.svg"
      : "/images/coast.svg";
  const useIllustration = !tour.image_url || failed;

  return (
    <div className="tour-picture">
      <img
        src={useIllustration ? fallback : tour.image_url}
        alt={useIllustration ? `Minh họa phong cảnh cho tour ${tour.destination}` : tour.title}
        loading="lazy"
        width="800"
        height="500"
        onError={() => setFailed(true)}
      />
      <span className="duration-badge">{tour.duration_days} ngày</span>
      {useIllustration && <span className="illustration-label">Ảnh minh họa</span>}
    </div>
  );
}

export default function TourCard({ tour }) {
  return (
    <article className="tour-card">
      <TourImage key={tour.image_url || "illustration"} tour={tour} />
      <div className="tour-content">
        <p className="tour-destination">{tour.destination} · {tour.region}</p>
        <h3>{tour.title}</h3>
        <p className="tour-meta">Khởi hành từ {tour.departure_location}</p>
        <div className="tour-tags">
          {(tour.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="tour-price-row">
          <p><span className="price-label">Giá từ / người</span><strong>{formatPrice(tour.price_from)}</strong></p>
          <span className="departure-count">{tour.available_departures} lịch<br />khởi hành</span>
        </div>
        <details className="tour-summary">
          <summary>Xem giới thiệu</summary>
          <p>{tour.description}</p>
        </details>
      </div>
    </article>
  );
}
