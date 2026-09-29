BEGIN;

INSERT INTO destinations (name, slug, region)
VALUES
    ('Đà Lạt', 'da-lat', 'Tây Nguyên'),
    ('Đà Nẵng', 'da-nang', 'Miền Trung'),
    ('Phú Quốc', 'phu-quoc', 'Miền Nam'),
    ('Nha Trang', 'nha-trang', 'Miền Trung'),
    ('Sa Pa', 'sa-pa', 'Miền Bắc'),
    ('Hạ Long', 'ha-long', 'Miền Bắc');

INSERT INTO tours (
    destination_id,
    title,
    slug,
    description,
    duration_days,
    departure_location,
    tags
)
SELECT
    d.id,
    v.title,
    v.slug,
    v.description,
    v.duration_days,
    v.departure_location,
    v.tags
FROM (
    VALUES
    (
        'da-lat',
        'Khám phá Đà Lạt 3 ngày 2 đêm',
        'kham-pha-da-lat-3n2d',
        'Tham quan thành phố Đà Lạt, khám phá thiên nhiên và trải nghiệm ẩm thực địa phương.',
        3,
        'TP. Hồ Chí Minh',
        ARRAY['thiên nhiên', 'nghỉ dưỡng', 'ẩm thực']
    ),
    (
        'da-nang',
        'Đà Nẵng - Hội An 3 ngày 2 đêm',
        'da-nang-hoi-an-3n2d',
        'Khám phá biển Đà Nẵng, tham quan phố cổ Hội An và trải nghiệm văn hóa địa phương.',
        3,
        'TP. Hồ Chí Minh',
        ARRAY['biển', 'văn hóa', 'ẩm thực']
    ),
    (
        'phu-quoc',
        'Nghỉ dưỡng Phú Quốc 4 ngày 3 đêm',
        'nghi-duong-phu-quoc-4n3d',
        'Trải nghiệm kỳ nghỉ tại Phú Quốc với các hoạt động tham quan và nghỉ dưỡng bên biển.',
        4,
        'TP. Hồ Chí Minh',
        ARRAY['biển', 'nghỉ dưỡng', 'gia đình']
    ),
    (
        'nha-trang',
        'Du lịch Nha Trang 3 ngày 2 đêm',
        'du-lich-nha-trang-3n2d',
        'Khám phá thành phố biển Nha Trang và thưởng thức các món ăn đặc trưng.',
        3,
        'TP. Hồ Chí Minh',
        ARRAY['biển', 'ẩm thực', 'gia đình']
    ),
    (
        'sa-pa',
        'Trải nghiệm Sa Pa 3 ngày 2 đêm',
        'trai-nghiem-sa-pa-3n2d',
        'Khám phá cảnh quan vùng cao và tìm hiểu văn hóa bản địa tại Sa Pa.',
        3,
        'Hà Nội',
        ARRAY['núi', 'thiên nhiên', 'văn hóa']
    ),
    (
        'ha-long',
        'Khám phá Hạ Long 2 ngày 1 đêm',
        'kham-pha-ha-long-2n1d',
        'Tham quan cảnh quan vịnh Hạ Long và trải nghiệm hành trình trên vịnh.',
        2,
        'Hà Nội',
        ARRAY['biển', 'thiên nhiên', 'nghỉ dưỡng']
    )
) AS v (
    destination_slug,
    title,
    slug,
    description,
    duration_days,
    departure_location,
    tags
)
JOIN destinations d ON d.slug = v.destination_slug;

INSERT INTO tour_departures (
    tour_id,
    start_date,
    price_per_person,
    capacity
)
SELECT
    t.id,
    CURRENT_DATE + v.days_from_today,
    v.price,
    v.capacity
FROM (
    VALUES
    ('kham-pha-da-lat-3n2d', 30, 2500000, 20),
    ('kham-pha-da-lat-3n2d', 45, 2700000, 20),

    ('da-nang-hoi-an-3n2d', 30, 3500000, 25),
    ('da-nang-hoi-an-3n2d', 45, 3700000, 25),

    ('nghi-duong-phu-quoc-4n3d', 30, 4500000, 20),
    ('nghi-duong-phu-quoc-4n3d', 45, 4800000, 20),

    ('du-lich-nha-trang-3n2d', 30, 2800000, 30),
    ('du-lich-nha-trang-3n2d', 45, 3000000, 30),

    ('trai-nghiem-sa-pa-3n2d', 30, 3200000, 20),
    ('trai-nghiem-sa-pa-3n2d', 45, 3400000, 20),

    ('kham-pha-ha-long-2n1d', 30, 2900000, 25),
    ('kham-pha-ha-long-2n1d', 45, 3100000, 25)
) AS v (
    tour_slug,
    days_from_today,
    price,
    capacity
)
JOIN tours t ON t.slug = v.tour_slug;

COMMIT;