-- OPTIONAL DEMO DATA. Only after 001_FRESH_DATABASE_ONLY.sql on an empty catalog.
-- These tours/prices are fictional study data; not actual commercial offers.
BEGIN;
DO $$ BEGIN
IF EXISTS(SELECT 1 FROM tours) OR EXISTS(SELECT 1 FROM destinations) THEN
 RAISE EXCEPTION 'Catalog already contains data. Do not reseed it.';
END IF; END $$;
INSERT INTO destinations(name,slug,region) VALUES('Đà Lạt','da-lat','Tây Nguyên');
INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,tags,status) SELECT id,'Khám phá Đà Lạt 3 ngày 2 đêm','da-lat-demo','Hành trình mẫu cho đồ án: tham quan cảnh quan, tìm hiểu văn hóa và khám phá ẩm thực. Lịch trình chi tiết cần được biên soạn trước khi bán tour thực tế.',3,'TP. Hồ Chí Minh',ARRAY['thiên nhiên','nghỉ dưỡng','ẩm thực'],'active' FROM destinations WHERE slug='da-lat';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+30,2500000,25 FROM tours WHERE slug='da-lat-demo';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+45,2700000,25 FROM tours WHERE slug='da-lat-demo';
INSERT INTO destinations(name,slug,region) VALUES('Đà Nẵng','da-nang','Miền Trung');
INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,tags,status) SELECT id,'Đà Nẵng - Hội An 3 ngày 2 đêm','da-nang-demo','Hành trình mẫu cho đồ án: tham quan cảnh quan, tìm hiểu văn hóa và khám phá ẩm thực. Lịch trình chi tiết cần được biên soạn trước khi bán tour thực tế.',3,'TP. Hồ Chí Minh',ARRAY['biển','văn hóa','ẩm thực'],'active' FROM destinations WHERE slug='da-nang';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+30,3500000,25 FROM tours WHERE slug='da-nang-demo';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+45,3700000,25 FROM tours WHERE slug='da-nang-demo';
INSERT INTO destinations(name,slug,region) VALUES('Phú Quốc','phu-quoc','Miền Nam');
INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,tags,status) SELECT id,'Nghỉ dưỡng Phú Quốc 4 ngày 3 đêm','phu-quoc-demo','Hành trình mẫu cho đồ án: tham quan cảnh quan, tìm hiểu văn hóa và khám phá ẩm thực. Lịch trình chi tiết cần được biên soạn trước khi bán tour thực tế.',4,'TP. Hồ Chí Minh',ARRAY['biển','nghỉ dưỡng','gia đình'],'active' FROM destinations WHERE slug='phu-quoc';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+30,4500000,25 FROM tours WHERE slug='phu-quoc-demo';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+45,4700000,25 FROM tours WHERE slug='phu-quoc-demo';
INSERT INTO destinations(name,slug,region) VALUES('Nha Trang','nha-trang','Miền Trung');
INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,tags,status) SELECT id,'Du lịch Nha Trang 3 ngày 2 đêm','nha-trang-demo','Hành trình mẫu cho đồ án: tham quan cảnh quan, tìm hiểu văn hóa và khám phá ẩm thực. Lịch trình chi tiết cần được biên soạn trước khi bán tour thực tế.',3,'TP. Hồ Chí Minh',ARRAY['biển','ẩm thực','gia đình'],'active' FROM destinations WHERE slug='nha-trang';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+30,2800000,25 FROM tours WHERE slug='nha-trang-demo';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+45,3000000,25 FROM tours WHERE slug='nha-trang-demo';
INSERT INTO destinations(name,slug,region) VALUES('Sa Pa','sa-pa','Miền Bắc');
INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,tags,status) SELECT id,'Trải nghiệm Sa Pa 3 ngày 2 đêm','sa-pa-demo','Hành trình mẫu cho đồ án: tham quan cảnh quan, tìm hiểu văn hóa và khám phá ẩm thực. Lịch trình chi tiết cần được biên soạn trước khi bán tour thực tế.',3,'Hà Nội',ARRAY['núi','thiên nhiên','văn hóa'],'active' FROM destinations WHERE slug='sa-pa';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+30,3200000,25 FROM tours WHERE slug='sa-pa-demo';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+45,3400000,25 FROM tours WHERE slug='sa-pa-demo';
INSERT INTO destinations(name,slug,region) VALUES('Hạ Long','ha-long','Miền Bắc');
INSERT INTO tours(destination_id,title,slug,description,duration_days,departure_location,tags,status) SELECT id,'Khám phá Hạ Long 2 ngày 1 đêm','ha-long-demo','Hành trình mẫu cho đồ án: tham quan cảnh quan, tìm hiểu văn hóa và khám phá ẩm thực. Lịch trình chi tiết cần được biên soạn trước khi bán tour thực tế.',2,'Hà Nội',ARRAY['biển','thiên nhiên','nghỉ dưỡng'],'active' FROM destinations WHERE slug='ha-long';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+30,2900000,25 FROM tours WHERE slug='ha-long-demo';
INSERT INTO tour_departures(tour_id,start_date,price_per_person,capacity) SELECT id,CURRENT_DATE+45,3100000,25 FROM tours WHERE slug='ha-long-demo';
COMMIT;
