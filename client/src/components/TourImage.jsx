import { useState } from "react";

export default function TourImage({ tour }) {
  const [failed, setFailed] = useState(false);

  const localTourImages = {
    "Hạ Long": "/images/tours/halong.jpg",
    "Sa Pa": "/images/tours/sapa.jpg",
    "Nha Trang": "/images/tours/nhatrang.jpg",
    "Phú Quốc": "/images/tours/phuquoc.jpg",
    "Đà Nẵng": "/images/tours/danang.jpg",
    "Đà Lạt": "/images/tours/dalat.jpg",
  };

  const fallback =
    localTourImages[tour.destination] || "/images/coast.svg";

  const imageSrc =
    tour.image_url && !failed
      ? tour.image_url
      : fallback;

  return (
    <div className="tour-picture">
      <img
        src={imageSrc}
        alt={tour.title}
        loading="lazy"
        width="800"
        height="500"
        onError={() => setFailed(true)}
      />

      <span className="duration-badge">
        {tour.duration_days} ngày
      </span>
    </div>
  );
}