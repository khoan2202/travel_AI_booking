-- Bước 5: bảng nhật ký thao tác của admin (ai làm gì, với đối tượng nào, lúc nào).
BEGIN;
CREATE TABLE admin_audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  -- Ví dụ: 'tour.create', 'booking.mark_paid'.
  action VARCHAR(60) NOT NULL,
  -- Loại đối tượng ('tour', 'booking'...) và id của đối tượng đó.
  entity_type VARCHAR(30) NOT NULL,
  entity_id INTEGER NOT NULL,
  -- Thông tin thêm dạng JSON, ví dụ mã đối soát, ghi chú.
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at DESC);
COMMIT;
