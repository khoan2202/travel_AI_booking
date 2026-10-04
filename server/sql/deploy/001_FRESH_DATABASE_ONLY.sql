-- ONLY for a NEW EMPTY database. Never run over your current project database.
BEGIN;
DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('destinations','tours','tour_departures','users','user_sessions','bookings','admin_audit_logs','booking_payment_events')) THEN
 RAISE EXCEPTION 'Database is not empty. Use migrations or restore into another empty database.';
END IF; END $$;

CREATE TABLE destinations (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 slug VARCHAR(120) NOT NULL UNIQUE,
 region VARCHAR(50) NOT NULL
);
CREATE TABLE tours (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 destination_id INTEGER NOT NULL REFERENCES destinations(id),
 title VARCHAR(200) NOT NULL,
 slug VARCHAR(220) NOT NULL UNIQUE,
 description TEXT NOT NULL,
 duration_days INTEGER NOT NULL CHECK(duration_days>0),
 departure_location VARCHAR(100) NOT NULL,
 image_url TEXT,
 tags TEXT[] NOT NULL DEFAULT '{}',
 status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('draft','active','archived')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE tour_departures (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 tour_id INTEGER NOT NULL REFERENCES tours(id),
 start_date DATE NOT NULL,
 price_per_person NUMERIC(12,0) NOT NULL CHECK(price_per_person>0),
 capacity INTEGER NOT NULL CHECK(capacity>0),
 seats_booked INTEGER NOT NULL DEFAULT 0 CHECK(seats_booked>=0 AND seats_booked<=capacity),
 status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','cancelled','completed')),
 UNIQUE(tour_id,start_date)
);



CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (email = lower(btrim(email)))
);

-- Cấu trúc tương thích với connect-pg-simple.
CREATE TABLE user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_user_sessions_expire ON user_sessions(expire);





CREATE TABLE bookings (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    departure_id INTEGER NOT NULL REFERENCES tour_departures(id),
    request_key UUID NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count BETWEEN 1 AND 20),
    unit_price NUMERIC(12,0) NOT NULL CHECK (unit_price > 0),
    total_price NUMERIC(14,0) NOT NULL CHECK (total_price = unit_price * guest_count),
    tour_title VARCHAR(200) NOT NULL,
    departure_date DATE NOT NULL,
    contact_name VARCHAR(100) NOT NULL CHECK (char_length(contact_name) BETWEEN 2 AND 100),
    contact_email VARCHAR(254) NOT NULL,
    contact_phone VARCHAR(16) NOT NULL CHECK (contact_phone ~ '^\+?[0-9]{9,15}$'),
    notes VARCHAR(500) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT bookings_user_request_unique UNIQUE (user_id, request_key),
    CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);

CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC, id DESC);
CREATE INDEX idx_bookings_departure ON bookings(departure_id);




CREATE TABLE admin_audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(60) NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id INTEGER NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at DESC);



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


CREATE INDEX IF NOT EXISTS idx_departures_public ON tour_departures(tour_id,start_date) WHERE status='scheduled';
COMMIT;
