// Khung chọn lịch khởi hành và số người ở trang chi tiết tour, tính tổng tiền tạm tính.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { getTourDepartures } from "../services/tourApi.js";
import { formatPrice } from "../utils/format.js";
import { checkoutPath } from "../utils/booking.js";

// API trả ngày dạng YYYY-MM-DD: đảo thứ tự để không bị lệch múi giờ.
function formatDepartureDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

// Props: tourId (id tour), initialDepartures (danh sách lịch đi đã tải sẵn).
export default function DeparturePicker({ tourId, initialDepartures }) {
  // selectedId và guests giữ dạng chuỗi vì lấy trực tiếp từ ô input.
  const [departures, setDepartures] = useState(initialDepartures);
  const [selectedId, setSelectedId] = useState("");
  const [guests, setGuests] = useState("1");
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [refreshFailed, setRefreshFailed] = useState(false);
  // Request "kiểm tra lại" đang chạy, để hủy khi bấm lại hoặc khi rời trang.
  const pendingRequest = useRef(null);

  // Rời trang thì hủy request còn dang dở.
  useEffect(() => () => pendingRequest.current?.abort(), []);

  // Các giá trị tính từ state: lịch đang chọn, số khách hợp lệ không, đủ chỗ không, tổng tiền.
  const selected = departures.find((item) => String(item.id) === selectedId);
  const guestCount = Number(guests);
  const validGuests = Number.isInteger(guestCount) && guestCount >= 1 && guestCount <= 20;
  const enoughSeats = selected && guestCount <= selected.available_seats;
  const totalPrice = selected ? Number(selected.price_per_person) * guestCount : 0;
  const validTotal = Number.isSafeInteger(totalPrice) && totalPrice > 0;
  // Chỉ hiện tổng tiền và cho đi tiếp khi mọi điều kiện đều đúng.
  const canQuote = selected && validGuests && enoughSeats && validTotal && !refreshFailed;

  // Tải lại giá và số chỗ mới nhất từ server (người khác có thể vừa đặt hết chỗ).
  async function refreshDepartures() {
    pendingRequest.current?.abort();
    const controller = new AbortController();
    pendingRequest.current = controller;
    setRefreshing(true);
    setMessage("");
    try {
      const latest = await getTourDepartures(tourId, controller.signal);
      if (controller.signal.aborted) return;
      setDepartures(latest);
      setRefreshFailed(false);

      // Lịch đang chọn không còn trong danh sách mới (hết chỗ hoặc đã đóng) thì bỏ chọn.
      if (selectedId && !latest.some((item) => String(item.id) === selectedId)) {
        setSelectedId("");
        setMessage("Lịch vừa chọn hiện không còn đặt được. Vui lòng chọn lịch khác.");
      } else {
        setMessage("Đã cập nhật giá và số chỗ. Vui lòng xem lại tổng tạm tính.");
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setRefreshFailed(true);
        setMessage(error.message || "Không kiểm tra được lịch đi. Vui lòng thử lại.");
      }
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }

  // Phần giao diện.
  return (
    <aside className="departure-panel" aria-labelledby="departure-heading">
      <div className="departure-panel-heading">
        <p className="section-kicker">CHUẨN BỊ CHUYẾN ĐI</p>
        <h2 id="departure-heading">Chọn lịch khởi hành</h2>
        <p>Giá tính theo từng người, cho lịch bạn chọn.</p>
      </div>

      {/* Không có lịch nào thì hiện thông báo, có thì hiện danh sách lựa chọn */}
      {departures.length === 0 ? (
        <p className="no-departures" role="status">Tour hiện chưa có lịch khởi hành còn chỗ. Bạn có thể kiểm tra lại sau.</p>
      ) : (
        <fieldset className="departure-options" disabled={refreshing}>
          <legend>Ngày khởi hành</legend>
          {departures.map((item) => (
            <label className={selectedId === String(item.id) ? "departure-option is-selected" : "departure-option"} key={item.id}>
              <input
                type="radio"
                name="departure"
                value={item.id}
                checked={selectedId === String(item.id)}
                onChange={(event) => setSelectedId(event.target.value)}
                aria-label={`Khởi hành ${formatDepartureDate(item.start_date)}`}
              />
              <span className="departure-option-content">
                <span className="departure-date"><time dateTime={item.start_date}>{formatDepartureDate(item.start_date)}</time><small>Còn {item.available_seats} chỗ</small></span>
                <strong>{formatPrice(item.price_per_person)}<small>/ người</small></strong>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {/* Ô nhập số người: tối đa bằng số chỗ còn lại và không quá 20 */}
      <label className="guests-field" htmlFor="guest-count">Số người
        <input
          id="guest-count"
          type="number"
          inputMode="numeric"
          min="1"
          max={Math.min(selected?.available_seats || 20, 20)}
          step="1"
          value={guests}
          disabled={!selected || refreshing}
          onChange={(event) => setGuests(event.target.value)}
          aria-describedby="guest-hint"
          aria-invalid={Boolean(selected && (!validGuests || !enoughSeats || !validTotal))}
        />
      </label>
      {/* Dòng gợi ý thay đổi theo tình huống: chưa chọn lịch, số người sai, thiếu chỗ... */}
      <p id="guest-hint" className="guest-hint">
        {!selected ? "Chọn một lịch khởi hành để nhập số người."
          : !validGuests ? "Mỗi đơn nhận từ 1 đến 20 người."
            : !enoughSeats ? `Lịch này chỉ còn ${selected.available_seats} chỗ.`
              : !validTotal ? "Số lượng vượt giới hạn tính toán. Vui lòng giảm số người."
                : `Lịch đã chọn hiện còn ${selected.available_seats} chỗ.`}
      </p>

      <div className="quote-summary" aria-live="polite">
        <span>Tổng tạm tính</span>
        <strong>{refreshing ? "Đang kiểm tra…" : canQuote ? formatPrice(totalPrice) : "—"}</strong>
        {canQuote && !refreshing && <small>{guestCount} người × {formatPrice(selected.price_per_person)}</small>}
      </div>
      <button className="button button-secondary refresh-departures" type="button" onClick={refreshDepartures} disabled={refreshing}>
        {refreshing ? "Đang kiểm tra…" : "Kiểm tra lại giá và chỗ"}
      </button>
      {message && <p className={refreshFailed ? "refresh-message is-error" : "refresh-message"} role={refreshFailed ? "alert" : "status"}>{message}</p>}
      {/* Đủ điều kiện thì hiện link sang trang đặt tour, chưa đủ thì hiện nút bị khóa */}
      {canQuote && !refreshing ? <Link className="button button-primary booking-continue" to={checkoutPath(tourId, selected.id, guestCount)}>Tiếp tục đặt tour <span aria-hidden="true">→</span></Link> : <button className="button button-primary booking-continue" type="button" disabled>Tiếp tục đặt tour</button>}
      <p className="quote-note">Chỗ được giữ khi bạn xác nhận và hệ thống tạo đơn thành công ở bước tiếp theo.</p>
    </aside>
  );
}
