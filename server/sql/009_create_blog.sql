-- Bước 9: bảng bài viết blog và 6 bài mẫu.
-- Chạy lại nhiều lần vẫn an toàn (IF NOT EXISTS, ON CONFLICT DO NOTHING).
-- Nội dung bài viết dùng cú pháp Markdown đơn giản: ## tiêu đề, **đậm**, *nghiêng*,
-- - danh sách, > trích dẫn, [chữ](link), ![mô tả ảnh](link ảnh).
BEGIN;

CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL CHECK (char_length(trim(title)) >= 5),
    -- Slug là phần cuối của đường dẫn, ví dụ /blog/mot-ngay-o-hoi-an.
    slug VARCHAR(220) NOT NULL UNIQUE,
    -- Đoạn tóm tắt hiện trên thẻ bài viết.
    excerpt VARCHAR(400) NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    -- guide: cẩm nang; destination: điểm đến; food: ẩm thực; tips: kinh nghiệm.
    category VARCHAR(20) NOT NULL DEFAULT 'guide'
        CHECK (category IN ('guide', 'destination', 'food', 'tips')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    -- Gắn với một điểm đến để gợi ý tour liên quan ở cuối bài (có thể để trống).
    destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL DEFAULT 'Travel Mint',
    -- draft: nháp; published: đã đăng; archived: đã ẩn.
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),
    -- Bài nổi bật được đặt to ở đầu trang blog.
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    -- Ngày đăng ở tương lai nghĩa là hẹn giờ: tới giờ bài mới hiện ra.
    published_at TIMESTAMPTZ,
    view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Bài đã đăng thì bắt buộc có ngày đăng.
    CHECK (status <> 'published' OR published_at IS NOT NULL)
);

-- Index cho trang blog: lấy bài đã đăng, mới nhất trước.
CREATE INDEX IF NOT EXISTS idx_blog_posts_public ON blog_posts(status, published_at DESC);

-- Bài mẫu. Bài nào đã có (trùng slug) thì bỏ qua, không ghi đè bài admin đã sửa.
INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, category, tags, destination_id, status, featured, published_at)
VALUES
(
  'Một ngày thật chậm ở phố cổ Hội An',
  'mot-ngay-that-cham-o-pho-co-hoi-an',
  'Dậy sớm khi phố còn vắng, trưa trốn nắng trong nhà cổ, chiều ra rừng dừa và tối thả đèn trên sông Hoài: gợi ý lịch trình một ngày không vội ở Hội An.',
  $post$Hội An đẹp nhất khi bạn không cố đi cho hết. Phố cổ nhỏ, đi bộ vài bước là qua một con đường, nên một ngày là đủ để cảm được nhịp sống ở đây, miễn là bạn chịu đi chậm.

## Buổi sáng: phố cổ lúc còn vắng

Hãy ra phố trước 7 giờ. Lúc này đoàn khách chưa tới, ánh nắng xiên qua những bức tường vàng và người dân mới bắt đầu mở cửa hàng. Đây là thời điểm đẹp nhất để chụp ảnh **Chùa Cầu** và dãy nhà dọc đường Trần Phú.

![Phố cổ Hội An](/images/destinations/hoi-an-2.jpg)

Bữa sáng nên là một tô **cao lầu** hoặc một ổ bánh mì nóng. Cao lầu có sợi mì dai, vàng nhạt, ăn cùng thịt xíu, rau sống và ít nước, khác hẳn những món mì nước quen thuộc.

## Buổi trưa: trốn nắng trong nhà cổ

Giữa trưa phố khá nóng, đây là lúc ghé các hội quán và nhà cổ. Vé tham quan phố cổ thường được bán theo combo nhiều điểm, nên hãy chọn hai ba nơi bạn thật sự thích thay vì cố đi hết.

- Hội quán của người Hoa với mái ngói và hoành phi chạm trổ công phu
- Nhà cổ nhiều đời với gian thờ, sân trong và đồ gỗ
- Một quán cà phê trên gác nhìn xuống mái ngói rêu phong

## Buổi chiều: rừng dừa và làng rau

Khi nắng dịu, đạp xe ra **rừng dừa Bảy Mẫu** ở Cẩm Thanh để đi thuyền thúng, hoặc ghé **làng rau Trà Quế** xem người dân chăm những luống rau thơm. Quãng đường bằng phẳng, đạp xe rất dễ chịu.

## Buổi tối: đèn lồng trên sông Hoài

Hội An lên đèn là lúc phố đẹp nhất. Đi dọc sông Hoài, thả một chiếc đèn hoa đăng rồi ngồi lại với chén chè hoặc đĩa **cơm gà**.

> Mẹo nhỏ: nếu đi vào dịp rằm âm lịch, phố thường có đêm phố cổ với đèn lồng và nhiều hoạt động truyền thống. Hãy xem lịch trước khi đặt chuyến.

Muốn đi Hội An mà không phải tự lo xe và chỗ ở? Bạn có thể xem [các tour đang mở bán](/#tours) hoặc [làm quiz 1 phút](/quiz) để tìm chuyến hợp với mình.$post$,
  '/images/destinations/hoi-an-1.jpg', 'destination', ARRAY['hội an', 'phố cổ', 'lịch trình 1 ngày'],
  (SELECT id FROM destinations WHERE name = 'Hội An' ORDER BY id LIMIT 1), 'published', TRUE, NOW() - INTERVAL '2 days'
),
(
  'Hà Giang mùa nào đẹp nhất? Lịch ngắm cảnh theo từng tháng',
  'ha-giang-mua-nao-dep-nhat',
  'Mùa hoa tam giác mạch, mùa lúa chín hay mùa nước đổ? Mỗi thời điểm ở Hà Giang có một vẻ đẹp riêng, và đây là cách chọn tháng phù hợp với bạn.',
  $post$Hà Giang không có mùa nào "xấu", chỉ có mùa hợp hoặc chưa hợp với điều bạn muốn thấy. Trước khi đặt chuyến, hãy xác định bạn đi để ngắm gì.

## Tháng 1 đến tháng 3: hoa đào, hoa mận

Cuối đông sang xuân, sắc hoa đào và hoa mận điểm trên các bản làng vùng cao. Trời có thể rất lạnh và nhiều sương, nên cần áo ấm và lái xe cẩn thận trên đèo.

## Tháng 5 đến tháng 6: mùa nước đổ

Khi nước được dẫn vào ruộng bậc thang, cả sườn núi sáng lên như những tấm gương. **Hoàng Su Phì** là nơi đáng đi nhất vào thời điểm này.

![Cung đường Hà Giang](/images/destinations/ha-giang-2.jpg)

## Tháng 9 đến tháng 10: lúa chín

Ruộng bậc thang chuyển màu vàng, thời tiết khô ráo hơn và trời trong. Đây là khoảng thời gian rất dễ chịu để đi cung **Đồng Văn, Mã Pí Lèng, sông Nho Quế**.

## Tháng 10 đến tháng 11: tam giác mạch

Mùa nổi tiếng nhất của Hà Giang. Hoa tam giác mạch nở trắng hồng trên các triền đá ở Đồng Văn, Sủng Là và Phố Cáo. Đây cũng là mùa đông khách nhất, nên hãy đặt chỗ sớm.

## Vài lưu ý để chuyến đi an toàn

- Đường đèo nhiều khúc cua gắt: nếu chưa quen đi xe máy đường núi, nên chọn xe có tài xế hoặc đi theo đoàn
- Mang áo khoác kể cả mùa hè, vì sáng sớm và ban đêm trên cao khá lạnh
- Rút sẵn tiền mặt, vì nhiều bản làng chưa thanh toán thẻ được
- Tôn trọng người dân: xin phép trước khi chụp ảnh, nhất là với trẻ em

> Thời điểm hoa nở và lúa chín thay đổi theo thời tiết từng năm, vì vậy hãy hỏi lại tình hình thực tế trước ngày đi.

Xem thêm các [tour Hà Giang có lịch khởi hành sắp tới](/#tours) hoặc nhờ [Tư vấn AI](/recommendations) gợi ý chuyến phù hợp.$post$,
  '/images/destinations/ha-giang-1.jpg', 'guide', ARRAY['hà giang', 'mùa đẹp', 'vùng cao'],
  (SELECT id FROM destinations WHERE name = 'Hà Giang' ORDER BY id LIMIT 1), 'published', FALSE, NOW() - INTERVAL '6 days'
),
(
  'Ăn gì ở Huế: 7 món nên thử trong chuyến đầu tiên',
  'an-gi-o-hue-7-mon-nen-thu',
  'Từ tô bún bò cay nồng đến chén chè ngọt thanh, ẩm thực Huế tinh tế và nhiều món nhỏ xinh. Đây là 7 món nên thử khi lần đầu đến cố đô.',
  $post$Người Huế nấu ăn kỹ, trình bày đẹp và thường chia thành nhiều món nhỏ. Vì vậy, cách ăn ngon nhất ở Huế là ăn ít một, ăn nhiều lần trong ngày.

## 1. Bún bò Huế

Sợi bún to, nước dùng thơm mùi sả và mắm ruốc, vị cay nồng đặc trưng. Món này thường được ăn vào buổi sáng.

## 2. Cơm hến

Món dân dã gồm cơm nguội, hến xào, rau sống, đậu phộng, tóp mỡ và chén nước hến nóng. Vị đậm và khá cay, nên hãy báo trước nếu bạn ăn cay kém.

## 3. Bánh bèo

Những chén bánh nhỏ phủ tôm chấy và tóp mỡ, chan nước mắm rồi xúc bằng thanh tre.

![Cố đô Huế](/images/destinations/hue-2.jpg)

## 4. Bánh nậm

Bột gạo mỏng, nhân tôm thịt, gói lá dong rồi hấp chín. Vị nhẹ, mềm và thơm mùi lá.

## 5. Bánh lọc

Vỏ bột lọc trong và dai, nhân tôm thịt đậm đà, chấm nước mắm ớt.

## 6. Nem lụi

Thịt nướng quấn quanh que sả, cuốn cùng bánh tráng, rau sống và chấm nước lèo sánh bùi.

## 7. Chè Huế

Huế có rất nhiều loại chè. **Chè bột lọc heo quay** là món lạ miệng nên thử một lần, còn chè đậu ván hay chè hạt sen có vị ngọt thanh dễ ăn.

> Gợi ý: gọi nhiều món bánh một lúc rồi chia cùng bạn đồng hành, bạn sẽ thử được nhiều vị hơn mà không bị no quá nhanh.

Sau khi ăn no, đừng quên ghé Đại Nội và lăng tẩm. Xem [tour Huế đang mở bán](/#tours) để có lịch trình trọn vẹn hơn.$post$,
  '/images/destinations/hue-1.jpg', 'food', ARRAY['huế', 'ẩm thực', 'món ngon'],
  (SELECT id FROM destinations WHERE name = 'Huế' ORDER BY id LIMIT 1), 'published', FALSE, NOW() - INTERVAL '11 days'
),
(
  'Đi biển tháng nào? Chọn điểm đến theo mùa khô từng vùng',
  'di-bien-thang-nao-chon-diem-den-theo-mua',
  'Việt Nam có đường bờ biển dài nên gần như tháng nào cũng có nơi biển đẹp. Bảng gợi ý nhanh giúp bạn tránh mùa mưa bão ở từng vùng.',
  $post$Khí hậu thay đổi rõ rệt từ Bắc vào Nam, nên cùng một tháng có nơi biển xanh lặng, có nơi lại mưa gió. Dưới đây là khoảng thời gian thường đẹp để đi biển ở từng vùng.

## Phú Quốc: khoảng tháng 11 đến tháng 4

Đây là mùa khô của đảo, trời nắng, biển êm và rất hợp để lặn ngắm san hô ở phía nam đảo.

![Biển Phú Quốc](/images/destinations/phu-quoc-1.jpg)

## Nha Trang: khoảng tháng 2 đến tháng 8

Nha Trang có nhiều ngày nắng trong năm. Cuối năm thường là mùa mưa, biển có thể động.

## Đà Nẵng và Hội An: khoảng tháng 3 đến tháng 8

Nắng đẹp, biển trong và hợp với gia đình có trẻ nhỏ. Từ khoảng tháng 9 đến tháng 12, miền Trung dễ gặp mưa lớn và bão.

## Quy Nhơn: khoảng tháng 3 đến tháng 9

Biển trong, ít đông đúc hơn các thành phố du lịch lớn, rất hợp với người thích yên tĩnh.

## Côn Đảo: khoảng tháng 3 đến tháng 6

Biển lặng, nước trong và thuận lợi cho các chuyến ra đảo nhỏ. Mùa rùa biển lên đẻ thường nằm trong nửa cuối năm, hãy hỏi trước nếu bạn muốn trải nghiệm hoạt động này.

## Hạ Long và Cát Bà: khoảng tháng 4 đến tháng 10

Mùa hè hợp để tắm biển, nhưng cần theo dõi tin bão vì các chuyến tàu có thể tạm dừng khi thời tiết xấu.

> Những mốc trên chỉ mang tính tham khảo. Trước ngày đi, hãy xem dự báo thời tiết và hỏi đơn vị tổ chức về chính sách đổi lịch.

Chưa biết chọn nơi nào? [Làm quiz 1 phút](/quiz) hoặc [so sánh các tour](/compare) để quyết định dễ hơn.$post$,
  '/images/destinations/phu-quoc-2.jpg', 'tips', ARRAY['biển', 'mùa du lịch', 'kinh nghiệm'],
  (SELECT id FROM destinations WHERE name = 'Phú Quốc' ORDER BY id LIMIT 1), 'published', FALSE, NOW() - INTERVAL '16 days'
),
(
  'Ninh Bình 2 ngày 1 đêm: lịch trình gọn cho người bận rộn',
  'ninh-binh-2-ngay-1-dem',
  'Tràng An, Tam Cốc, Hang Múa và một đêm yên tĩnh giữa núi đá vôi. Lịch trình cuối tuần gọn gàng cho người xuất phát từ Hà Nội.',
  $post$Ninh Bình cách Hà Nội không xa nên rất hợp cho một chuyến cuối tuần. Quần thể danh thắng **Tràng An** đã được UNESCO công nhận là di sản thế giới, với núi đá vôi, hang động và những dòng sông yên ả.

## Ngày 1: Tràng An và Hang Múa

**Buổi sáng:** khởi hành sớm từ Hà Nội, đến nơi rồi đi thuyền ở Tràng An. Một vòng thuyền thường mất khoảng vài tiếng, đi qua nhiều hang động và đền nhỏ.

**Buổi chiều:** leo **Hang Múa** lúc nắng đã dịu. Đường lên có hàng trăm bậc đá, hơi mệt nhưng đỉnh núi nhìn xuống cánh đồng và dòng sông rất đáng công sức.

![Núi đá vôi Ninh Bình](/images/destinations/ninh-binh-2.jpg)

**Buổi tối:** nghỉ tại một homestay gần Tam Cốc và thử **cơm cháy**, **thịt dê núi**, hai đặc sản nổi tiếng của vùng.

## Ngày 2: Tam Cốc và chùa Bái Đính

**Buổi sáng:** đi thuyền trên sông Ngô Đồng ở Tam Cốc. Nếu đi vào khoảng cuối tháng 5 đến đầu tháng 6, bạn có thể gặp mùa lúa chín vàng hai bên bờ.

**Buổi chiều:** ghé **chùa Bái Đính** trước khi về lại Hà Nội.

## Chuẩn bị gì?

- Giày đế bám để leo Hang Múa
- Mũ, kem chống nắng và nước uống khi đi thuyền
- Trang phục kín đáo khi vào chùa

Bạn có thể xem [tour Ninh Bình đang mở bán](/#tours) để không phải tự lo xe và chỗ nghỉ.$post$,
  '/images/destinations/ninh-binh-1.jpg', 'guide', ARRAY['ninh bình', 'cuối tuần', 'lịch trình'],
  (SELECT id FROM destinations WHERE name = 'Ninh Bình' ORDER BY id LIMIT 1), 'published', FALSE, NOW() - INTERVAL '21 days'
),
(
  '10 việc nên làm trước khi đặt một tour du lịch',
  '10-viec-nen-lam-truoc-khi-dat-tour',
  'Đọc kỹ lịch trình, kiểm tra chi phí đã gồm những gì, hỏi chính sách hủy... Danh sách ngắn giúp chuyến đi của bạn suôn sẻ ngay từ đầu.',
  $post$Một chuyến đi tốt bắt đầu từ vài phút kiểm tra trước khi đặt. Hãy lưu lại danh sách dưới đây cho lần tới.

## Trước khi chọn tour

1. **Xác định mục tiêu chuyến đi:** nghỉ ngơi, khám phá, ăn uống hay chụp ảnh
2. **Chốt ngân sách** cho cả chuyến, gồm cả tiền tiêu cá nhân
3. **Kiểm tra thời tiết** tại điểm đến vào đúng thời gian dự định đi
4. **So sánh vài tour** về giá, số ngày và ngày khởi hành

Trang [So sánh tour](/compare) cho phép bạn đặt tối đa 3 tour cạnh nhau để xem nhanh khác biệt.

## Khi đọc thông tin tour

5. **Đọc kỹ lịch trình** từng ngày và thời gian di chuyển
6. **Hỏi rõ giá đã gồm gì:** vận chuyển, khách sạn, bữa ăn, vé tham quan, bảo hiểm
7. **Hỏi chính sách đổi và hủy** trước khi thanh toán

## Trước ngày khởi hành

8. **Kiểm tra giấy tờ:** căn cước còn hạn, giấy tờ của trẻ em đi cùng
9. **Chuẩn bị thuốc cá nhân** và báo trước nếu bạn bị dị ứng thức ăn
10. **Lưu số điện thoại hỗ trợ** và thông tin đơn đặt tour trên điện thoại

> Có thắc mắc trước khi đặt? Hãy gửi câu hỏi qua trang [Liên hệ & Hỗ trợ](/contact), đội ngũ Travel Mint sẽ phản hồi lại bạn.$post$,
  '/images/destinations/da-lat-1.jpg', 'tips', ARRAY['kinh nghiệm', 'đặt tour', 'checklist'],
  NULL, 'published', FALSE, NOW() - INTERVAL '27 days'
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
