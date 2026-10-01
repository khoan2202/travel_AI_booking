import { Link } from "react-router";
import TourImage from "./TourImage.jsx";
import { formatPrice } from "../utils/format.js";

export default function TourCard({ tour }) {
  return (
    <article className="tour-card">
      <Link to={`/tours/${tour.id}`} aria-label={`Xem tour ${tour.title}`}>
        <TourImage key={tour.image_url || "illustration"} tour={tour} />
      </Link>
      <div className="tour-content">
        <p className="tour-destination">{tour.destination} · {tour.region}</p>
        <h3><Link to={`/tours/${tour.id}`}>{tour.title}</Link></h3>
        <p className="tour-meta">Khởi hành từ {tour.departure_location}</p>
        <div className="tour-tags">
          {(tour.tags || []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="tour-price-row">
          <p><span className="price-label">Giá từ / người</span><strong>{formatPrice(tour.price_from)}</strong></p>
          <span className="departure-count">{tour.available_departures} lịch<br />khởi hành</span>
        </div>
        <Link className="button button-secondary tour-detail-link" to={`/tours/${tour.id}`}>
          Xem chi tiết <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
