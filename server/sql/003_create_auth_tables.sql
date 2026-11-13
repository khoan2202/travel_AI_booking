-- Bước 3: tạo bảng tài khoản và bảng lưu phiên đăng nhập.
BEGIN;

-- Tài khoản người dùng. role = 'admin' mới vào được trang quản trị.
-- Muốn tạo admin: đăng ký tài khoản thường, rồi chạy
-- UPDATE users SET role = 'admin' WHERE email = '...';
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    email VARCHAR(254) NOT NULL UNIQUE,
    -- Chỉ lưu mã băm bcrypt, không lưu mật khẩu gốc.
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Email luôn được lưu ở dạng chữ thường, không có khoảng trắng hai đầu.
    CHECK (email = lower(btrim(email)))
);

-- Cấu trúc tương thích với connect-pg-simple.
CREATE TABLE user_sessions (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX idx_user_sessions_expire ON user_sessions(expire);

COMMIT;
