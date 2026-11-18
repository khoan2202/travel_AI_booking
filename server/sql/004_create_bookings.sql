-- Bước 4: tạo bảng đơn đặt tour.
BEGIN;

CREATE TABLE bookings (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Ai đặt và đặt lịch nào.
    user_id INTEGER NOT NULL REFERENCES users(id),
    departure_id INTEGER NOT NULL REFERENCES tour_departures(id),
    -- mã ngẫu nhiên trình duyệt tạo cho mỗi lần đặt, để bấm hai lần không ra hai đơn
    request_key UUID NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count BETWEEN 1 AND 20),
    -- giá chốt lúc đặt, admin đổi giá sau này không ảnh hưởng đơn cũ
    unit_price NUMERIC(12,0) NOT NULL CHECK (unit_price > 0),
    total_price NUMERIC(14,0) NOT NULL CHECK (total_price = unit_price * guest_count),
    -- tên tour và ngày đi cũng chép lại, phòng tour bị sửa sau này
    tour_title VARCHAR(200) NOT NULL,
    departure_date DATE NOT NULL,
    contact_name VARCHAR(100) NOT NULL CHECK (char_length(contact_name) BETWEEN 2 AND 100),
    contact_email VARCHAR(254) NOT NULL,
    contact_phone VARCHAR(16) NOT NULL CHECK (contact_phone ~ '^\+?[0-9]{9,15}$'),
    notes VARCHAR(500) NOT NULL DEFAULT '',
    -- confirmed: đơn còn hiệu lực; cancelled: đã hủy.
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    -- unpaid: chưa thanh toán; paid: đã thanh toán; refunded: đã hoàn tiền.
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    -- Mỗi người dùng không dùng một request_key hai lần.
    CONSTRAINT bookings_user_request_unique UNIQUE (user_id, request_key),
    -- Đơn đã hủy thì phải có thời điểm hủy, và ngược lại.
    CHECK ((status = 'cancelled') = (cancelled_at IS NOT NULL))
);

-- Index cho trang "Đơn của tôi" (sắp xếp theo ngày tạo mới nhất).
CREATE INDEX idx_bookings_user_created ON bookings(user_id, created_at DESC, id DESC);
CREATE INDEX idx_bookings_departure ON bookings(departure_id);

COMMIT;
