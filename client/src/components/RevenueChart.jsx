// Biểu đồ cột tiền đã thu 6 tháng gần nhất. Rê chuột hoặc Tab vào cột để xem chi tiết, bảng số liệu nằm ở "Xem dạng bảng".
import { formatPrice } from "../utils/format.js";

// làm tròn đỉnh trục lên số đẹp: 3,2 triệu thành 5 triệu
function niceMax(value) {
  if (value <= 0) return 1000000;
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 2.5, 5, 10].find((step) => step * power >= value) * power;
}

// 2500000 thành "2,5 tr"
function compact(value) {
  const short = (number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(number);
  if (value >= 1e9) return `${short(value / 1e9)} tỷ`;
  if (value >= 1e6) return `${short(value / 1e6)} tr`;
  if (value >= 1e3) return `${short(value / 1e3)} k`;
  return "0";
}

const money = (value) => (Number(value) > 0 ? formatPrice(value) : "0 ₫");
const monthLabel = (month) => `T${Number(month.slice(5))}`;
const fullMonth = (month) => `Tháng ${Number(month.slice(5))}/${month.slice(0, 4)}`;

export default function RevenueChart({ months }) {
  const values = months.map((item) => Number(item.received));
  const highest = Math.max(...values);
  const top = niceMax(highest);
  const empty = highest <= 0;

  return (
    <figure className="rev-chart">
      <div className="rev-plot">
        {[1, 0.5, 0].map((ratio) => (
          <div className="rev-grid" key={ratio} style={{ "--r": ratio }}><span>{compact(top * ratio)}</span></div>
        ))}
        <ol className="rev-cols">
          {months.map((item, index) => {
            const value = values[index];
            const isPeak = !empty && value === highest;
            return (
              <li className="rev-col" key={item.month} tabIndex={0} aria-label={`${fullMonth(item.month)}: đã thu ${money(item.received)}, hoàn ${money(item.refunded)}, ${item.bookings} đơn mới`}>
                <span className="rev-track">
                  {value > 0 && (
                    <span className="rev-bar" style={{ height: `${(value / top) * 100}%` }}>
                      {/* chỉ ghi số trên cột cao nhất cho đỡ rối */}
                      {isPeak && <b>{compact(value)}</b>}
                    </span>
                  )}
                </span>
                <span className="rev-month">{monthLabel(item.month)}</span>
                <span className="rev-tip" role="presentation">
                  <strong>{fullMonth(item.month)}</strong>
                  <span>Đã thu <b>{money(item.received)}</b></span>
                  <span>Đã hoàn <b>{money(item.refunded)}</b></span>
                  <span>Đơn mới <b>{item.bookings}</b></span>
                </span>
              </li>
            );
          })}
        </ol>
        {empty && <p className="rev-empty">Chưa ghi nhận khoản thu nào trong 6 tháng qua.</p>}
      </div>
      <details className="rev-table">
        <summary>Xem dạng bảng</summary>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Tháng</th><th>Đã thu</th><th>Đã hoàn</th><th>Đơn mới</th></tr></thead>
            <tbody>{months.map((item) => <tr key={item.month}><td>{fullMonth(item.month)}</td><td>{money(item.received)}</td><td>{money(item.refunded)}</td><td>{item.bookings}</td></tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
