-- Bước 1: điểm đến, tour, lịch khởi hành.
-- Chạy các file theo thứ tự tên, 001 tới 009 (002 và 008 là dữ liệu mẫu).
-- Mỗi file bọc trong BEGIN/COMMIT nên lỗi giữa chừng thì không để lại gì dở dang.
BEGIN;

-- Điểm đến, ví dụ Đà Lạt (khu vực Tây Nguyên).
CREATE TABLE destinations (
    -- GENERATED ALWAYS AS IDENTITY: database tự tăng id (1, 2, 3...).
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    region VARCHAR(50) NOT NULL
);

-- Tour: mỗi tour thuộc một điểm đến.
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

    -- Mảng tag, ví dụ {'biển','ẩm thực'}.
    tags TEXT[] NOT NULL DEFAULT '{}',

    -- draft: nháp (khách không thấy); active: đang bán; archived: ngừng bán.
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('draft', 'active', 'archived')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lịch khởi hành: một tour có nhiều ngày đi, mỗi ngày có giá và số chỗ riêng.
CREATE TABLE tour_departures (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tour_id INTEGER NOT NULL REFERENCES tours(id),

    start_date DATE NOT NULL,

    -- tiền VND dùng NUMERIC chứ không dùng số thực, khỏi sai số lẻ
    price_per_person NUMERIC(12, 0) NOT NULL
        CHECK (price_per_person > 0),

    capacity INTEGER NOT NULL
        CHECK (capacity > 0),

    -- chỗ đã đặt không bao giờ vượt sức chứa, DB tự chặn bằng CHECK
    seats_booked INTEGER NOT NULL DEFAULT 0
        CHECK (seats_booked >= 0 AND seats_booked <= capacity),

    status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'cancelled', 'completed')),

    -- Một tour không có hai lịch đi trùng ngày.
    UNIQUE (tour_id, start_date)
);

-- Index giúp tìm kiếm theo điểm đến và theo ngày đi nhanh hơn.
CREATE INDEX idx_tours_destination_id
    ON tours(destination_id);

CREATE INDEX idx_departures_start_date
    ON tour_departures(start_date);

COMMIT;