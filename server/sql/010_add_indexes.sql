-- Bước 10: bổ sung index cho các truy vấn thật sự có trong code. Chạy lại nhiều lần được (IF NOT EXISTS).
-- Các index đã có từ trước (không thêm lại): bookings(user_id, created_at, id), bookings(departure_id),
-- tour_departures UNIQUE(tour_id, start_date), blog_posts(status, published_at), booking_payment_events UNIQUE(booking_id, kind).
BEGIN;

-- Trang chi tiết đơn của admin: WHERE entity_type='booking' AND entity_id=$1 ORDER BY id DESC LIMIT 30.
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON admin_audit_logs(entity_type, entity_id, id DESC);

-- Khóa ngoại không tự có index trong PostgreSQL; thiếu thì xóa/sửa dòng cha phải quét cả bảng con.
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON admin_audit_logs(actor_id);

-- Trang hỗ trợ của admin lọc theo trạng thái rồi sắp xếp theo id mới nhất, và đếm số yêu cầu đang chờ.
CREATE INDEX IF NOT EXISTS idx_support_status_id ON support_requests(status, id DESC);
CREATE INDEX IF NOT EXISTS idx_support_user ON support_requests(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_booking ON support_requests(booking_id) WHERE booking_id IS NOT NULL;

-- Blog: bài gợi ý theo điểm đến, và khóa ngoại tới users/destinations (ON DELETE SET NULL).
CREATE INDEX IF NOT EXISTS idx_blog_posts_destination ON blog_posts(destination_id) WHERE destination_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id) WHERE author_id IS NOT NULL;

-- Các bảng tour/đơn hiện còn nhỏ nên chưa thêm index cho bookings(status, payment_status):
-- cột ít giá trị khác nhau, Postgres vẫn chọn quét tuần tự. Hãy đo bằng EXPLAIN ANALYZE khi dữ liệu lớn hơn.
COMMIT;
