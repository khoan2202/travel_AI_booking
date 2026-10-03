BEGIN;

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

COMMIT;
