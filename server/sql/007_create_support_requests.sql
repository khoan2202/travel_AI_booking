BEGIN;

CREATE TABLE support_requests (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Khách chưa đăng nhập vẫn gửi hỗ trợ chung được.
    user_id INTEGER REFERENCES users(id),

    -- Có thể chọn một đơn tour đã đặt hoặc để trống.
    booking_id INTEGER REFERENCES bookings(id),

    full_name VARCHAR(100) NOT NULL
        CHECK (char_length(trim(full_name)) BETWEEN 2 AND 100),

    phone VARCHAR(16) NOT NULL
        CHECK (phone ~ '^\+?[0-9]{9,15}$'),

    message TEXT NOT NULL
        CHECK (char_length(trim(message)) BETWEEN 10 AND 3000),

    -- pending: chưa xử lý; resolved: đã xử lý.
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'resolved')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;