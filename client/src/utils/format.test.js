// Test các hàm định dạng dùng khắp giao diện: giá tiền, ngày, slug, mã đơn, lưu đơn đang chờ.
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, normalizeText } from "./format.js";
import { formatDate, readingMinutes, slugify } from "./blog.js";
import { bookingCode, bookingDate, checkoutPath, clearPending, paymentStatus, readPending, savePending } from "./booking.js";

describe("format.js", () => {
  test("formatPrice: tiền Việt có dấu chấm ngăn cách; giá không hợp lệ thì 'Liên hệ'", () => {
    const text = formatPrice(2500000).replace(/\s/g, " ");
    assert.match(text, /^2\.500\.000 ₫$/);
    for (const bad of [0, -5, null, undefined, "abc", NaN]) assert.equal(formatPrice(bad), "Liên hệ");
    assert.match(formatPrice("1520000"), /1\.520\.000/);
  });

  test("normalizeText: bỏ dấu để tìm 'da lat' ra 'Đà Lạt'", () => {
    assert.equal(normalizeText("Đà Lạt"), "da lat");
    assert.equal(normalizeText("  PHÚ QUỐC "), "phu quoc");
    assert.equal(normalizeText(null), "");
  });
});

describe("blog.js", () => {
  test("slugify: bỏ dấu tiếng Việt, đ thành d, gọn các ký tự lạ", () => {
    assert.equal(slugify("Đà Lạt 3 ngày 2 đêm!"), "da-lat-3-ngay-2-dem");
    assert.equal(slugify("  --Hội   An--  "), "hoi-an");
    assert.equal(slugify("???"), "");
  });

  test("readingMinutes: ước tính khoảng 1200 ký tự mỗi phút, tối thiểu 1 phút", () => {
    assert.equal(readingMinutes(0), 1);
    assert.equal(readingMinutes(undefined), 1);
    assert.equal(readingMinutes(6000), 5);
  });

  test("formatDate: theo giờ Việt Nam, ngày/tháng/năm", () => {
    assert.equal(formatDate("2026-11-18T10:00:00Z"), "18/11/2026");
    // 20h UTC đã là sáng hôm sau ở Việt Nam (UTC+7).
    assert.equal(formatDate("2026-11-18T20:00:00Z"), "19/11/2026");
    assert.equal(formatDate(null), "");
  });
});

describe("booking.js", () => {
  test("mã đơn, ngày, trạng thái thanh toán, đường dẫn đặt tour", () => {
    assert.equal(bookingCode(15), "TM000015");
    assert.equal(bookingDate("2026-12-31"), "31/12/2026");
    assert.equal(paymentStatus("refunded"), "Đã hoàn tiền");
    assert.equal(checkoutPath(5, 12, 2), "/booking?tour=5&departure=12&guests=2");
  });

  describe("đơn đang chờ kết quả (chống đặt trùng khi rớt mạng)", () => {
    // sessionStorage giả để chạy ngoài trình duyệt.
    beforeEach(() => {
      const store = new Map();
      globalThis.sessionStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
    });

    test("lưu rồi đọc lại đúng mã yêu cầu cũ; xóa thì mất", () => {
      const item = { tourId: 3, body: { request_key: "11111111-1111-4111-8111-111111111111", departure_id: 9 } };
      assert.equal(readPending(1), null);
      savePending(1, item);
      assert.deepEqual(readPending(1), item);
      assert.equal(readPending(2), null, "mỗi tài khoản có dữ liệu riêng");
      clearPending(1);
      assert.equal(readPending(1), null);
    });

    test("dữ liệu lưu bị hỏng thì coi như không có, không gây lỗi", () => {
      sessionStorage.setItem("travel.pending-booking:1", "{không phải json");
      assert.equal(readPending(1), null);
      sessionStorage.setItem("travel.pending-booking:1", JSON.stringify({ tourId: "ba", body: {} }));
      assert.equal(readPending(1), null);
    });
  });
});
