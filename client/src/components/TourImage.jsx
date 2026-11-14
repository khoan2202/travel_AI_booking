// Ảnh của tour, kèm nhãn số ngày.
// Ưu tiên ảnh image_url trong DB; không có hoặc tải lỗi thì dùng ảnh bìa theo điểm đến
// (khai báo trong src/data/destinationImages.js).
import { useState } from "react";
import { imagesFor } from "../data/destinationImages.js";

export default function TourImage({ tour }) {
  // failed = true khi ảnh từ image_url tải lỗi.
  const [failed, setFailed] = useState(false);

  const fallback = imagesFor(tour.destination).cover.src;

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
        decoding="async"
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
