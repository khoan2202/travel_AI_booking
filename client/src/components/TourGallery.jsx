// Bộ sưu tập ảnh ở trang chi tiết tour:
// - Ảnh lớn (đổi ảnh có hiệu ứng mờ dần), nút trước/sau, số thứ tự ảnh.
// - Hàng ảnh nhỏ bên dưới để chọn nhanh.
// - Bấm ảnh lớn để xem toàn màn hình (lightbox): phím ← → để chuyển, Esc để đóng.
// - Ảnh có tác giả thì hiện dòng ghi công (bắt buộc với giấy phép CC BY / CC BY-SA).
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { imagesFor } from "../data/destinationImages.js";

export default function TourGallery({ tour }) {
  // Ảnh riêng của tour (image_url) đứng đầu, sau đó là ảnh theo điểm đến.
  const destination = imagesFor(tour.destination);
  const photos = tour.image_url
    ? [{ src: tour.image_url }, ...destination.gallery]
    : destination.gallery;

  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const openerRef = useRef(null);
  const current = photos[index];
  const many = photos.length > 1;

  // Chuyển ảnh, quay vòng khi tới đầu/cuối danh sách.
  const go = (step) => setIndex((value) => (value + step + photos.length) % photos.length);

  // Khi mở lightbox: khóa cuộn trang, đưa focus vào nút đóng, bắt phím tắt.
  // Khi đóng: mở lại cuộn trang và trả focus về ảnh đã bấm.
  useEffect(() => {
    if (!open) return;
    const opener = openerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
    // go chỉ đổi state qua hàm cập nhật nên không cần nằm trong danh sách phụ thuộc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const credit = current.author && (
    <a className="gallery-credit" href={current.source} target="_blank" rel="noopener noreferrer">
      Ảnh: {current.author} · {current.license}
    </a>
  );

  return (
    <div className="tour-gallery">
      <div className="gallery-main tour-picture">
        {/* Xếp chồng mọi ảnh, chỉ ảnh đang chọn hiện rõ: đổi ảnh sẽ mờ dần mượt */}
        <button
          type="button"
          className="gallery-open"
          ref={openerRef}
          onClick={() => setOpen(true)}
          aria-label={`Xem ảnh ${index + 1} trên ${photos.length} toàn màn hình`}
        >
          {photos.map((photo, i) => (
            <img
              key={photo.src}
              src={photo.src}
              alt={i === index ? `${tour.title}, ảnh ${i + 1}` : ""}
              className={i === index ? "is-active" : ""}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              width="960"
              height="580"
            />
          ))}
        </button>
        <span className="duration-badge">{tour.duration_days} ngày</span>
        {many && <>
          <button type="button" className="gallery-nav is-prev" onClick={() => go(-1)} aria-label="Ảnh trước"><span aria-hidden="true">‹</span></button>
          <button type="button" className="gallery-nav is-next" onClick={() => go(1)} aria-label="Ảnh sau"><span aria-hidden="true">›</span></button>
          <span className="gallery-count" aria-hidden="true">{index + 1} / {photos.length}</span>
        </>}
      </div>
      {credit}

      {/* Hàng ảnh nhỏ */}
      {many && (
        <div className="gallery-thumbs" role="group" aria-label="Chọn ảnh">
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              className={i === index ? "gallery-thumb is-active" : "gallery-thumb"}
              onClick={() => setIndex(i)}
              aria-label={`Ảnh ${i + 1}`}
              aria-pressed={i === index}
            >
              <img src={photo.src} alt="" loading="lazy" decoding="async" width="160" height="100" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox xem ảnh toàn màn hình. Render thẳng vào <body> (portal) để luôn phủ kín
          màn hình, không bị khung của các phần tử cha (có hiệu ứng) giới hạn. */}
      {open && createPortal(
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Ảnh ${tour.title}`} onClick={() => setOpen(false)}>
          {/* Bấm vào vùng tối bên ngoài để đóng; bấm vào ảnh hoặc nút thì không đóng */}
          <figure className="lightbox-figure" onClick={(event) => event.stopPropagation()}>
            <img key={current.src} src={current.src} alt={`${tour.title}, ảnh ${index + 1}`} />
            <figcaption>
              <span>{index + 1} / {photos.length} · {tour.destination}</span>
              {credit}
            </figcaption>
          </figure>
          <button type="button" className="lightbox-close" ref={closeRef} onClick={() => setOpen(false)} aria-label="Đóng">×</button>
          {many && <>
            <button type="button" className="lightbox-nav is-prev" onClick={(event) => { event.stopPropagation(); go(-1); }} aria-label="Ảnh trước">‹</button>
            <button type="button" className="lightbox-nav is-next" onClick={(event) => { event.stopPropagation(); go(1); }} aria-label="Ảnh sau">›</button>
          </>}
        </div>,
        document.body,
      )}
    </div>
  );
}
