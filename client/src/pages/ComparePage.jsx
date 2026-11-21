// So sánh tối đa 3 tour cạnh nhau (/compare?ids=1,2,3).
// Danh sách lấy từ URL để gửi link được, không có thì lấy từ khay so sánh. Giá và chỗ luôn tải mới từ server.
// Tour rẻ nhất, đi sớm nhất, dài ngày nhất được đánh dấu.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import TourImage from "../components/TourImage.jsx";
import { useCompare, COMPARE_LIMIT } from "../context/CompareContext.js";
import { getTourById, getTourDepartures } from "../services/tourApi.js";
import { formatPrice } from "../utils/format.js";
import { bookingDate } from "../utils/booking.js";

// "1,2,3" thành danh sách id hợp lệ (số dương, không trùng, tối đa 3)
function parseIds(value) {
  const ids = String(value || "").split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)].slice(0, COMPARE_LIMIT);
}

// tải tour và lịch đi rồi tính các con số để so
async function loadTour(id, signal) {
  const [tour, departures] = await Promise.all([getTourById(id, signal), getTourDepartures(id, signal)]);
  const next = departures[0] || null; // API đã sắp lịch theo ngày
  return {
    ...tour,
    price: tour.price_from ? Number(tour.price_from) : null,
    nextDate: next?.start_date || null,
    nextSeats: next?.available_seats ?? null,
    departureCount: departures.length,
  };
}

// id của tour nhỏ nhất/lớn nhất; các tour bằng nhau thì không đánh dấu
function best(tours, getValue, pickMax = false) {
  const values = tours.map(getValue).filter((v) => v != null);
  if (values.length < 2 || new Set(values).size < 2) return null;
  const target = pickMax ? Math.max(...values) : Math.min(...values);
  return tours.find((t) => getValue(t) === target)?.id ?? null;
}

export default function ComparePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { items, remove } = useCompare();
  const urlIds = parseIds(params.get("ids"));
  const ids = urlIds.length ? urlIds : items.map((item) => item.id);
  const idsKey = ids.join(",");

  const [tours, setTours] = useState(null);
  const [missing, setMissing] = useState(0);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  // tour đã ngừng bán (404) thì bỏ qua và báo có mấy tour bị thiếu
  useEffect(() => {
    const controller = new AbortController();
    const list = idsKey ? idsKey.split(",").map(Number) : [];
    Promise.allSettled(list.map((id) => loadTour(id, controller.signal))).then((results) => {
      if (controller.signal.aborted) return;
      const ok = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
      const failed = results.filter((r) => r.status === "rejected");
      const hardError = failed.find((r) => ![400, 404].includes(r.reason?.status));
      setError(hardError && !ok.length ? hardError.reason.message : "");
      setMissing(failed.length);
      setTours(ok);
    });
    return () => controller.abort();
  }, [idsKey, retry]);

  // bỏ tour khỏi bảng thì cập nhật cả URL lẫn khay
  function drop(id) {
    remove(id);
    const rest = ids.filter((x) => x !== id);
    navigate(rest.length ? `/compare?ids=${rest.join(",")}` : "/compare", { replace: true });
  }

  const loading = tours === null && !error;
  const list = tours || [];
  const cheapest = best(list, (t) => t.price);
  const soonest = best(list, (t) => (t.nextDate ? Date.parse(t.nextDate) : null));
  const longest = best(list, (t) => t.duration_days, true);

  // mỗi hàng: nhãn bên trái, mỗi tour một cột
  const rows = [
    { label: "Điểm đến", render: (t) => <>{t.destination}<small>{t.region}</small></> },
    { label: "Giá từ / người", render: (t) => <strong className="compare-price">{t.price ? formatPrice(t.price) : "Liên hệ"}</strong>, badge: (t) => t.id === cheapest && "Rẻ nhất" },
    { label: "Số ngày", render: (t) => `${t.duration_days} ngày`, badge: (t) => t.id === longest && "Dài ngày nhất" },
    { label: "Lịch gần nhất", render: (t) => t.nextDate ? <>{bookingDate(t.nextDate)}<small>còn {t.nextSeats} chỗ</small></> : "Chưa có lịch", badge: (t) => t.id === soonest && "Đi sớm nhất" },
    { label: "Số lịch khởi hành", render: (t) => `${t.departureCount} lịch` },
    { label: "Khởi hành từ", render: (t) => t.departure_location },
    { label: "Phù hợp với", render: (t) => <span className="compare-tags">{(t.tags || []).map((tag) => <span key={tag}>{tag}</span>)}</span> },
  ];

  return (
    <><Header />
      <main className="container compare-page">
        <p className="section-kicker">CÂN NHẮC TRƯỚC KHI ĐI</p>
        <h1>So sánh tour</h1>
        <p className="compare-intro">Đặt các hành trình cạnh nhau để chọn chuyến phù hợp nhất. Giá và chỗ được cập nhật mới nhất từ hệ thống.</p>

        {loading && <p role="status" className="compare-state">Đang tải thông tin tour…</p>}
        {error && <div className="state-box" role="alert"><p>{error}</p><button className="button button-primary" type="button" onClick={() => setRetry((n) => n + 1)}>Thử lại</button></div>}
        {missing > 0 && !loading && <p className="compare-note" role="status">{missing} tour không còn mở bán nên đã được ẩn khỏi bảng.</p>}

        {/* chưa đủ 2 tour thì chỉ cách chọn */}
        {!loading && !error && list.length < 2 && (
          <div className="state-box compare-empty">
            <h2>{list.length === 1 ? "Chọn thêm ít nhất 1 tour nữa" : "Chưa có tour nào để so sánh"}</h2>
            <p>Bấm nút <strong>“+ So sánh”</strong> trên các thẻ tour (tối đa {COMPARE_LIMIT} tour), hoặc làm quiz để nhận gợi ý.</p>
            <div className="account-actions"><Link className="button button-primary" to="/#tours">Chọn tour</Link><Link className="button button-secondary" to="/quiz">Làm quiz tìm chuyến đi</Link></div>
          </div>
        )}

        {/* màn hình hẹp thì bảng cuộn ngang */}
        {!loading && list.length >= 2 && (
          <div className="compare-scroll">
            <div className="compare-table" style={{ "--cols": list.length }} role="table" aria-label="Bảng so sánh tour">
              <div className="compare-row compare-head" role="row">
                <div className="compare-label" role="columnheader"><span className="sr-only">Tour</span></div>
                {list.map((t) => (
                  <div className="compare-cell" role="columnheader" key={t.id}>
                    <TourImage tour={t} />
                    <h2><Link to={`/tours/${t.id}`}>{t.title}</Link></h2>
                    <button type="button" className="compare-remove" onClick={() => drop(t.id)} aria-label={`Bỏ ${t.title} khỏi bảng so sánh`}>Bỏ khỏi so sánh</button>
                  </div>
                ))}
              </div>
              {rows.map((row) => (
                <div className="compare-row" role="row" key={row.label}>
                  <div className="compare-label" role="rowheader">{row.label}</div>
                  {list.map((t) => {
                    const badge = row.badge?.(t);
                    return (
                      <div className={badge ? "compare-cell is-best" : "compare-cell"} role="cell" key={t.id}>
                        {badge && <span className="compare-badge">{badge}</span>}
                        {row.render(t)}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="compare-row compare-foot" role="row">
                <div className="compare-label" role="rowheader"><span className="sr-only">Thao tác</span></div>
                {list.map((t) => (
                  <div className="compare-cell" role="cell" key={t.id}>
                    <Link className="button button-primary" to={`/tours/${t.id}`}>Chọn lịch & đặt <span aria-hidden="true">↗</span></Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    <Footer /></>
  );
}
