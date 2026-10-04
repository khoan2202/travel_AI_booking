BEGIN;
CREATE TABLE booking_payment_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  actor_id INTEGER NOT NULL REFERENCES users(id),
  kind VARCHAR(20) NOT NULL CHECK(kind IN ('payment','refund')),
  amount NUMERIC(14,0) NOT NULL CHECK(amount>0),
  reference VARCHAR(120) NOT NULL,
  note VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id,kind)
);
COMMIT;
