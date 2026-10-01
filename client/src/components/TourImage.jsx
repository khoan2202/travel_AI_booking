import { useState } from "react";

export default function TourImage({ tour }) {
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
