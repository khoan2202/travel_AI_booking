-- Bước 6: bảng lịch sử thanh toán/hoàn tiền do admin ghi nhận thủ công.
BEGIN;
CREATE TABLE booking_payment_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  actor_id INTEGER NOT NULL REFERENCES users(id),
  -- payment: khách đã trả tiền; refund: đã hoàn tiền cho khách.
  kind VARCHAR(20) NOT NULL CHECK(kind IN ('payment','refund')),
  amount NUMERIC(14,0) NOT NULL CHECK(amount>0),
  -- Mã đối soát, ví dụ mã giao dịch chuyển khoản.
  reference VARCHAR(120) NOT NULL,
  note VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Mỗi đơn có tối đa một lần thanh toán và một lần hoàn tiền.
  UNIQUE(booking_id,kind)
);
COMMIT;
