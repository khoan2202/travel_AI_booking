-- Bước 8 (không bắt buộc): thêm 13 điểm đến, 16 tour và lịch đi trải dài 1 năm.
-- Chạy lại nhiều lần không bị trùng (ON CONFLICT DO NOTHING). Ngày đi tính từ ngày chạy file nên luôn ở tương lai.
-- Ảnh tour lấy theo tên điểm đến trong client/src/data/destinationImages.js (image_url để trống).
-- Tour và giá chỉ là dữ liệu mẫu.
BEGIN;

-- 1. Điểm đến mới
INSERT INTO destinations (name, slug, region) VALUES
  ('Hội An', 'hoi-an', 'Miền Trung'),
  ('Huế', 'hue', 'Miền Trung'),
  ('Quy Nhơn', 'quy-nhon', 'Miền Trung'),
  ('Phong Nha', 'phong-nha', 'Miền Trung'),
  ('Mũi Né', 'mui-ne', 'Miền Trung'),
  ('Ninh Bình', 'ninh-binh', 'Miền Bắc'),
  ('Hà Giang', 'ha-giang', 'Miền Bắc'),
  ('Cát Bà', 'cat-ba', 'Miền Bắc'),
  ('Hà Nội', 'ha-noi', 'Miền Bắc'),
  ('Mộc Châu', 'moc-chau', 'Miền Bắc'),
  ('Côn Đảo', 'con-dao', 'Miền Nam'),
  ('Cần Thơ', 'can-tho', 'Miền Nam'),
  ('Buôn Ma Thuột', 'buon-ma-thuot', 'Tây Nguyên')
ON CONFLICT (slug) DO NOTHING;

-- 2. Tour mới (gắn với điểm đến theo slug). 3 tour cuối dùng điểm đến đã có sẵn.
INSERT INTO tours (destination_id, title, slug, description, duration_days, departure_location, tags, status)
SELECT d.id, v.title, v.slug, v.description, v.days, v.departure, v.tags, 'active'
FROM (VALUES
  ('hoi-an', 'Phố cổ Hội An đêm hoa đăng 3N2Đ', 'pho-co-hoi-an-3n2d',
   'Dạo phố cổ với những dãy nhà vàng và Chùa Cầu, thả hoa đăng trên sông Hoài khi phố lên đèn, thưởng thức cao lầu, bánh mì và đạp xe qua làng rau Trà Quế.',
   3, 'TP. Hồ Chí Minh', ARRAY['văn hóa', 'ẩm thực', 'nhiếp ảnh']),
  ('hue', 'Cố đô Huế và sông Hương 3N2Đ', 'co-do-hue-3n2d',
   'Tham quan Đại Nội, Ngọ Môn và các lăng tẩm triều Nguyễn, đi thuyền trên sông Hương nghe ca Huế, thưởng thức bún bò và các món bánh đặc trưng xứ Huế.',
   3, 'Hà Nội', ARRAY['văn hóa', 'lịch sử', 'ẩm thực']),
  ('quy-nhon', 'Quy Nhơn – Kỳ Co – Eo Gió 3N2Đ', 'quy-nhon-ky-co-3n2d',
   'Tắm biển nước trong xanh ở Kỳ Co, ngắm hoàng hôn ở Eo Gió, ghé làng chài Nhơn Lý và Bãi Đá Trứng, thưởng thức hải sản tươi của vùng biển Bình Định.',
   3, 'TP. Hồ Chí Minh', ARRAY['biển', 'ẩm thực', 'gia đình']),
  ('phong-nha', 'Khám phá động Phong Nha 3N2Đ', 'kham-pha-phong-nha-3n2d',
   'Đi thuyền trên sông Son vào động Phong Nha với hệ thạch nhũ kỳ ảo, khám phá Động Thiên Đường và trải nghiệm thiên nhiên Vườn quốc gia Phong Nha – Kẻ Bàng.',
   3, 'Hà Nội', ARRAY['hang động', 'thiên nhiên', 'phiêu lưu']),
  ('mui-ne', 'Đồi cát Mũi Né 3N2Đ', 'doi-cat-mui-ne-3n2d',
   'Ngắm bình minh trên đồi cát, khám phá Suối Tiên và đồi cát đỏ, dạo làng chài Mũi Né buổi sớm và nghỉ ngơi bên bờ biển Phan Thiết đầy nắng gió.',
   3, 'TP. Hồ Chí Minh', ARRAY['biển', 'nghỉ dưỡng', 'nhiếp ảnh']),
  ('ninh-binh', 'Tràng An – Tam Cốc 2N1Đ', 'trang-an-tam-coc-2n1d',
   'Ngồi thuyền xuyên qua các hang đá ở Tràng An, ngắm núi đá vôi soi bóng trên sông, leo Hang Múa ngắm toàn cảnh Tam Cốc và ghé cố đô Hoa Lư.',
   2, 'Hà Nội', ARRAY['thiên nhiên', 'văn hóa', 'gia đình']),
  ('ha-giang', 'Cung đường Hà Giang – Mã Pì Lèng 4N3Đ', 'ha-giang-ma-pi-leng-4n3d',
   'Chinh phục những cung đèo hùng vĩ, ngắm sông Nho Quế từ đèo Mã Pì Lèng, ghé cột cờ Lũng Cú, dinh thự họ Vương và chợ phiên vùng cao nguyên đá Đồng Văn.',
   4, 'Hà Nội', ARRAY['núi', 'thiên nhiên', 'phiêu lưu']),
  ('cat-ba', 'Cát Bà – vịnh Lan Hạ 3N2Đ', 'cat-ba-lan-ha-3n2d',
   'Du thuyền trên vịnh Lan Hạ, chèo kayak qua các đảo đá, tắm biển ở những bãi cát nhỏ, ngắm làng chài nổi và toàn cảnh đảo từ pháo đài Thần Công.',
   3, 'Hà Nội', ARRAY['biển', 'thiên nhiên', 'phiêu lưu']),
  ('ha-noi', 'Hà Nội 36 phố phường 2N1Đ', 'ha-noi-36-pho-phuong-2n1d',
   'Dạo quanh hồ Hoàn Kiếm, khám phá phố cổ và Văn Miếu, thưởng thức phở, bún chả, cà phê trứng và cảm nhận nhịp sống nghìn năm văn hiến.',
   2, 'TP. Hồ Chí Minh', ARRAY['văn hóa', 'ẩm thực', 'lịch sử']),
  ('moc-chau', 'Mộc Châu – đồi chè và cầu kính 2N1Đ', 'moc-chau-doi-che-2n1d',
   'Ngắm đồi chè trái tim trong sương sớm, đi cầu kính Bạch Long, ghé bản làng của đồng bào và thưởng thức sữa, bê chao đặc sản cao nguyên Mộc Châu.',
   2, 'Hà Nội', ARRAY['núi', 'thiên nhiên', 'gia đình']),
  ('con-dao', 'Côn Đảo hoang sơ 3N2Đ', 'con-dao-hoang-so-3n2d',
   'Tắm biển ở những bãi cát hoang sơ, khám phá Vườn quốc gia Côn Đảo, tìm hiểu di tích nhà tù lịch sử và tận hưởng không khí yên bình của đảo xa.',
   3, 'TP. Hồ Chí Minh', ARRAY['biển', 'lịch sử', 'nghỉ dưỡng']),
  ('can-tho', 'Miền Tây sông nước – chợ nổi Cái Răng 2N1Đ', 'can-tho-cho-noi-2n1d',
   'Dậy sớm đi chợ nổi Cái Răng, ghé vườn trái cây và lò hủ tiếu, đi xuồng qua kênh rạch và nghe đờn ca tài tử giữa miệt vườn Tây Nam Bộ.',
   2, 'TP. Hồ Chí Minh', ARRAY['sông nước', 'ẩm thực', 'văn hóa']),
  ('buon-ma-thuot', 'Buôn Ma Thuột – thác Dray Nur 3N2Đ', 'buon-ma-thuot-dray-nur-3n2d',
   'Ngắm thác Dray Nur hùng vĩ, thăm buôn làng người Ê Đê, tìm hiểu văn hóa cà phê ở thủ phủ cà phê và thưởng thức ẩm thực đại ngàn Tây Nguyên.',
   3, 'TP. Hồ Chí Minh', ARRAY['thiên nhiên', 'văn hóa', 'ẩm thực']),
  ('da-lat', 'Đà Lạt săn mây 2N1Đ', 'da-lat-san-may-2n1d',
   'Dậy sớm săn biển mây trên đồi chè, dạo hồ Xuân Hương và rừng thông, ghé chợ đêm và quán cà phê view đồi trong tiết trời se lạnh của Đà Lạt.',
   2, 'TP. Hồ Chí Minh', ARRAY['thiên nhiên', 'nhiếp ảnh', 'nghỉ dưỡng']),
  ('phu-quoc', 'Phú Quốc lặn ngắm san hô 3N2Đ', 'phu-quoc-lan-ngam-san-ho-3n2d',
   'Đi cano khám phá quần đảo An Thới, lặn ngắm san hô và cá nhiều màu sắc, tắm biển Bãi Sao, Bãi Kem và ngắm hoàng hôn ở Sunset Town.',
   3, 'TP. Hồ Chí Minh', ARRAY['biển', 'phiêu lưu', 'gia đình']),
  ('ha-long', 'Du thuyền vịnh Hạ Long 3N2Đ', 'du-thuyen-ha-long-3n2d',
   'Nghỉ đêm trên du thuyền giữa vịnh, ngắm hoàng hôn sau những dãy núi đá vôi, chèo kayak, thăm hang Sửng Sốt và tập thái cực quyền trên boong lúc bình minh.',
   3, 'Hà Nội', ARRAY['biển', 'nghỉ dưỡng', 'thiên nhiên'])
) AS v(dest, title, slug, description, days, departure, tags)
JOIN destinations d ON d.slug = v.dest
ON CONFLICT (slug) DO NOTHING;

-- 3. Lịch khởi hành cho tour mới: 5 đợt trải dài 1 năm (sau 20, 75, 150, 240 và 365 ngày).
--    Giá dao động nhẹ theo mùa (hệ số), làm tròn đến 10.000đ.
INSERT INTO tour_departures (tour_id, start_date, price_per_person, capacity, status)
SELECT t.id, CURRENT_DATE + o.days, ROUND(v.price * o.factor / 10000) * 10000, v.capacity, 'scheduled'
FROM (VALUES
  ('pho-co-hoi-an-3n2d', 3900000, 25), ('co-do-hue-3n2d', 3600000, 25),
  ('quy-nhon-ky-co-3n2d', 3500000, 25), ('kham-pha-phong-nha-3n2d', 4600000, 20),
  ('doi-cat-mui-ne-3n2d', 2800000, 30), ('trang-an-tam-coc-2n1d', 1900000, 30),
  ('ha-giang-ma-pi-leng-4n3d', 4200000, 16), ('cat-ba-lan-ha-3n2d', 3300000, 24),
  ('ha-noi-36-pho-phuong-2n1d', 2400000, 30), ('moc-chau-doi-che-2n1d', 1800000, 30),
  ('con-dao-hoang-so-3n2d', 6500000, 18), ('can-tho-cho-noi-2n1d', 1600000, 30),
  ('buon-ma-thuot-dray-nur-3n2d', 3200000, 25), ('da-lat-san-may-2n1d', 2100000, 25),
  ('phu-quoc-lan-ngam-san-ho-3n2d', 4300000, 20), ('du-thuyen-ha-long-3n2d', 5200000, 20)
) AS v(slug, price, capacity)
JOIN tours t ON t.slug = v.slug
CROSS JOIN (VALUES (20, 1.00), (75, 1.05), (150, 1.00), (240, 0.95), (365, 1.05)) AS o(days, factor)
ON CONFLICT (tour_id, start_date) DO NOTHING;

-- 4. Gia hạn lịch cho các tour đang bán khác: tour nào chưa có lịch đi xa hơn 300 ngày
--    thì thêm 3 đợt (sau 120, 240, 365 ngày), giá và sức chứa lấy theo lịch gần nhất của tour đó.
--    Nhờ vậy các tour cũ không bị ẩn khỏi trang chủ vì hết lịch.
INSERT INTO tour_departures (tour_id, start_date, price_per_person, capacity, status)
SELECT last.tour_id, CURRENT_DATE + o.days, last.price_per_person, last.capacity, 'scheduled'
FROM (
  SELECT DISTINCT ON (td.tour_id) td.tour_id, td.price_per_person, td.capacity
  FROM tour_departures td JOIN tours t ON t.id = td.tour_id
  WHERE t.status = 'active'
    AND NOT EXISTS (SELECT 1 FROM tour_departures x WHERE x.tour_id = td.tour_id AND x.start_date > CURRENT_DATE + 300)
  ORDER BY td.tour_id, td.start_date DESC, td.id DESC
) last
CROSS JOIN (VALUES (120), (240), (365)) AS o(days)
ON CONFLICT (tour_id, start_date) DO NOTHING;

COMMIT;
