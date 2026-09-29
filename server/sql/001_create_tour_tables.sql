BEGIN;

CREATE TABLE destinations (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    region VARCHAR(50) NOT NULL
);

CREATE TABLE tours (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    destination_id INTEGER NOT NULL
        REFERENCES destinations(id),

    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT NOT NULL,

    duration_days INTEGER NOT NULL
        CHECK (duration_days > 0),

    departure_location VARCHAR(100) NOT NULL,

    image_url TEXT,

    tags TEXT[] NOT NULL DEFAULT '{}',

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('draft', 'active', 'archived')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tour_departures (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES tours(id),

    start_date DATE NOT NULL,

    price_per_person NUMERIC(12, 0) NOT NULL
        CHECK (price_per_person > 0),

    capacity INTEGER NOT NULL
        CHECK (capacity > 0),

    seats_booked INTEGER NOT NULL DEFAULT 0
        CHECK (seats_booked >= 0 AND seats_booked <= capacity),

    status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'cancelled', 'completed')),

    UNIQUE (tour_id, start_date)
);

CREATE INDEX idx_tours_destination_id
    ON tours(destination_id);

CREATE INDEX idx_departures_start_date
    ON tour_departures(start_date);

COMMIT;