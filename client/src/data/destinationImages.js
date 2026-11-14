// Ảnh cho từng điểm đến: ảnh bìa (thẻ tour) và bộ sưu tập (trang chi tiết tour).
// Ảnh mới nằm trong client/public/images/destinations/, lấy từ Wikimedia Commons
// (giấy phép tự do CC BY / CC BY-SA / CC0 / Public domain). Giấy phép CC BY và CC BY-SA
// yêu cầu ghi tên tác giả, nên mỗi ảnh có credit đi kèm và được hiện trong bộ sưu tập.
// Ảnh cũ trong /images/tours/ có sẵn từ trước, chưa rõ nguồn nên không có credit.
// Thêm điểm đến mới: chép ảnh vào thư mục trên rồi thêm một mục vào destinationImages.

const DIR = "/images/destinations/";

// photo(tên file, tác giả, giấy phép, link trang ảnh gốc)
const photo = (file, author, license, source) => ({ src: DIR + file, author, license, source });

export const destinationImages = {
  "Măng Đen": {
    cover: photo("mang-den-1.jpg", "Đào Phúc Quang Vũ", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Cuoc-song-nguoi-dong-bao-tai-lang-kon-pring-thi-tran-mang-den-kon-tum-28.jpg"),
    gallery: [
      photo("mang-den-1.jpg", "Đào Phúc Quang Vũ", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Cuoc-song-nguoi-dong-bao-tai-lang-kon-pring-thi-tran-mang-den-kon-tum-28.jpg"),
      photo("mang-den-2.jpg", "Đào Phúc Quang Vũ", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Cuoc-song-nguoi-dong-bao-tai-lang-kon-pring-thi-tran-mang-den-kon-tum-38.jpg"),
      photo("mang-den-3.jpg", "Đào Phúc Quang Vũ", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Cuoc-song-nguoi-dong-bao-tai-lang-kon-pring-thi-tran-mang-den-kon-tum-10.jpg"),
    ],
  },
  "Hội An": {
    cover: photo("hoi-an-1.jpg", "Steffen Schmitz", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:H%E1%BB%99i_An,_Ch%C3%B9a_C%E1%BA%A7u,_2020-01_CN-02.jpg"),
    gallery: [
      photo("hoi-an-1.jpg", "Steffen Schmitz", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:H%E1%BB%99i_An,_Ch%C3%B9a_C%E1%BA%A7u,_2020-01_CN-02.jpg"),
      photo("hoi-an-2.jpg", "Steffen Schmitz", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:H%E1%BB%99i_An,_Ancient_Town,_2020-01_CN-05.jpg"),
      photo("hoi-an-3.jpg", "Steffen Schmitz", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:H%E1%BB%99i_An,_Chinese_Assembly_Hall,_2020-01_CN-01.jpg"),
    ],
  },
  "Huế": {
    cover: photo("hue-1.jpg", "Supanut Arunoprayote", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Gate_in_Imperial_City,_Hu%E1%BA%BF_(III).jpg"),
    gallery: [
      photo("hue-1.jpg", "Supanut Arunoprayote", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Gate_in_Imperial_City,_Hu%E1%BA%BF_(III).jpg"),
      photo("hue-2.jpg", "Vyacheslav Argenberg", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Vietnam,_Hue,_Imperial_City_of_Hue,_Meridian_Gate.jpg"),
      photo("hue-3.jpg", "Suicasmo", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Imperial_City,_Hue_20190917.jpg"),
    ],
  },
  "Ninh Bình": {
    cover: photo("ninh-binh-1.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Trang_An_Landscape_Complex,_Ninh_Binh_Province,_Vietnam,_20240202_1433_5284.jpg"),
    gallery: [
      photo("ninh-binh-1.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Trang_An_Landscape_Complex,_Ninh_Binh_Province,_Vietnam,_20240202_1433_5284.jpg"),
      photo("ninh-binh-2.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Trang_An_Landscape_Complex,_Ninh_Binh_Province,_Vietnam,_20240202_1406_5221.jpg"),
      photo("ninh-binh-3.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Trang_An_Landscape_Complex,_Ninh_Binh_Province,_Vietnam,_20240202_1524_5364.jpg"),
    ],
  },
  "Hà Giang": {
    cover: photo("ha-giang-1.jpg", "Jaybeelarsay", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Le_col_de_Ma_Pi_Leng_(Dong_Van-Meo_Vac).jpg"),
    gallery: [
      photo("ha-giang-1.jpg", "Jaybeelarsay", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Le_col_de_Ma_Pi_Leng_(Dong_Van-Meo_Vac).jpg"),
      photo("ha-giang-2.jpg", "miketnorton", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Ha_Giang_Loop,_Northern_Vietnam.jpg"),
      photo("ha-giang-3.jpg", "Vuong Tri Binh", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Ma_Pi_Leng_pass_viewed_from_Meo_Vac_in_2014_03.jpg"),
    ],
  },
  "Mũi Né": {
    cover: photo("mui-ne-1.jpg", "ruben i", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Mui_Ne_sand_dunes_1.jpg"),
    gallery: [
      photo("mui-ne-1.jpg", "ruben i", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Mui_Ne_sand_dunes_1.jpg"),
      photo("mui-ne-2.jpg", "Benoît Prieur", "CC0", "https://commons.wikimedia.org/wiki/File:Sand_dune_Mui_N%C3%A9_2003.jpg"),
      photo("mui-ne-3.jpg", "Vyacheslav Argenberg", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Vietnam,_Mui_Ne_sand_dunes,_trees_on_the_sand.jpg"),
    ],
  },
  "Côn Đảo": {
    cover: photo("con-dao-1.jpg", "Tycho", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Pulo_Condore_island_beach.jpg"),
    gallery: [
      photo("con-dao-1.jpg", "Tycho", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Pulo_Condore_island_beach.jpg"),
      photo("con-dao-2.jpg", "Daeva Trạc", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Beach_view_from_Six_Senses_Resort_in_C%C3%B4n_%C4%90%E1%BA%A3o_(April_2022).jpg"),
      photo("con-dao-3.jpg", "Tycho", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:C%C3%B4n_%C4%90%E1%BA%A3o_National_Park.jpg"),
    ],
  },
  "Quy Nhơn": {
    cover: photo("quy-nhon-1.jpg", "Pulencio from Tarlac, Philippines", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Nhon_Ly,_Quy_Nhon,_Vietnam_(53001404016).jpg"),
    gallery: [
      photo("quy-nhon-1.jpg", "Pulencio from Tarlac, Philippines", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Nhon_Ly,_Quy_Nhon,_Vietnam_(53001404016).jpg"),
      photo("quy-nhon-2.jpg", "Lê Hồ Bắc", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Ky_Co_beach,_Quy_Nhon_city,_Binh_Dinh_province,_Vietnam.jpg"),
      photo("quy-nhon-3.jpg", "Thuydaonguyen", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:B%C3%A3i_%C4%90%C3%A1_Tr%E1%BB%A9ng.jpg"),
    ],
  },
  "Phong Nha": {
    cover: photo("phong-nha-1.jpg", "Andre Hospers", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Dong_Hoi_Phong_Nha_grotten.jpg"),
    gallery: [
      photo("phong-nha-1.jpg", "Andre Hospers", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Dong_Hoi_Phong_Nha_grotten.jpg"),
      photo("phong-nha-2.jpg", "Andre Hospers", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Dong_Hoi_Phong_Nha_grotten_(68776).jpg"),
      photo("phong-nha-3.jpg", "Andre Hospers", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Dong_Hoi_Phong_Nha_grotten_(25104).jpg"),
    ],
  },
  "Cần Thơ": {
    cover: photo("can-tho-1.jpg", "Jean-Marc Astesana from Voisins le Bretonneux, France", "CC BY-SA 2.0", "https://commons.wikimedia.org/wiki/File:Cai_Rang_floating_market_(15886375226).jpg"),
    gallery: [
      photo("can-tho-1.jpg", "Jean-Marc Astesana from Voisins le Bretonneux, France", "CC BY-SA 2.0", "https://commons.wikimedia.org/wiki/File:Cai_Rang_floating_market_(15886375226).jpg"),
      photo("can-tho-2.jpg", "Jean-Marc Astesana from Voisins le Bretonneux, France", "CC BY-SA 2.0", "https://commons.wikimedia.org/wiki/File:Cai_Rang_floating_market_(15724707578).jpg"),
      photo("can-tho-3.jpg", "Christophe95", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Cai_Rang_Floating_Market_4.jpg"),
    ],
  },
  "Cát Bà": {
    cover: photo("cat-ba-1.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:View_of_the_sea_from_Cannon_Fort_Park_on_Cat_Ba_Island,_Vietnam,_20240130_1601_4441.jpg"),
    gallery: [
      photo("cat-ba-1.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:View_of_the_sea_from_Cannon_Fort_Park_on_Cat_Ba_Island,_Vietnam,_20240130_1601_4441.jpg"),
      photo("cat-ba-2.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Islands_southeast_of_Cat_Ba_Island_in_Vietnam,_20240131_1515_4743.jpg"),
      photo("cat-ba-3.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Cat_Ba_Island,_Vietnam,_20240131_1431_4699.jpg"),
    ],
  },
  "Hà Nội": {
    cover: photo("ha-noi-1.jpg", "Daderot", "CC0", "https://commons.wikimedia.org/wiki/File:Hoan_Kiem_Lake_-_Hanoi,_Vietnam_-_DSC03695.JPG"),
    gallery: [
      photo("ha-noi-1.jpg", "Daderot", "CC0", "https://commons.wikimedia.org/wiki/File:Hoan_Kiem_Lake_-_Hanoi,_Vietnam_-_DSC03695.JPG"),
      photo("ha-noi-2.jpg", "Daderot", "CC0", "https://commons.wikimedia.org/wiki/File:Hoan_Kiem_Lake_-_Hanoi,_Vietnam_-_DSC03685.JPG"),
      photo("ha-noi-3.jpg", "Daderot", "CC0", "https://commons.wikimedia.org/wiki/File:Hoan_Kiem_Lake_-_Hanoi,_Vietnam_-_DSC03687.JPG"),
    ],
  },
  "Buôn Ma Thuột": {
    cover: photo("buon-ma-thuot-1.jpg", "Sketyl", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Dray_Nur_Waterfall_(49483462012).jpg"),
    gallery: [
      photo("buon-ma-thuot-1.jpg", "Sketyl", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Dray_Nur_Waterfall_(49483462012).jpg"),
      photo("buon-ma-thuot-2.jpg", "Y Kpia Mlo", "CC BY-SA 3.0", "https://commons.wikimedia.org/wiki/File:Dray_nur_waterfall.jpg"),
    ],
  },
  "Mộc Châu": {
    cover: photo("moc-chau-1.jpg", "Trần Kiên Trung", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Moc_Chau_trong_suong_som_(20880297811).jpg"),
    gallery: [
      photo("moc-chau-1.jpg", "Trần Kiên Trung", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Moc_Chau_trong_suong_som_(20880297811).jpg"),
      photo("moc-chau-2.jpg", "DangTungDuong", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Bach_Long_glassbridge_2022.jpg"),
      photo("moc-chau-3.jpg", "Viethavvh at vi.wikipedia", "Public domain", "https://commons.wikimedia.org/wiki/File:Nha_san_Moc_Chau.jpg"),
    ],
  },
  "Đà Lạt": {
    cover: { src: "/images/tours/dalat.jpg" },
    gallery: [
      { src: "/images/tours/dalat.jpg" },
      photo("da-lat-1.jpg", "Le Anh Tuan", "Public domain", "https://commons.wikimedia.org/wiki/File:Xuan_Huong_Lake_in_Da_Lat_(28219543381).jpg"),
      photo("da-lat-2.jpg", "Diane Selwyn", "Public domain", "https://commons.wikimedia.org/wiki/File:Xuan_Huong_Lake_06.jpg"),
    ],
  },
  "Đà Nẵng": {
    cover: { src: "/images/tours/danang.jpg" },
    gallery: [
      { src: "/images/tours/danang.jpg" },
      photo("da-nang-1.jpg", "DvTor8303", "CC0", "https://commons.wikimedia.org/wiki/File:Golden_Bridge_at_Ba_Na_Hills_20250718.jpg"),
      photo("da-nang-2.jpg", "Vivu Vietnam", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Da_Nang_Golden_Bridge,_Sun_World_Ba_Na_Hills.jpg"),
    ],
  },
  "Phú Quốc": {
    cover: { src: "/images/tours/phuquoc.jpg" },
    gallery: [
      { src: "/images/tours/phuquoc.jpg" },
      photo("phu-quoc-1.jpg", "Vivu Vietnam", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Kem_Beach_aerial_view_Phu_Quoc_Island_Vietnam.jpg"),
      photo("phu-quoc-2.jpg", "Trantuonglam", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Bai-sao-phu-quoc-tuonglamphotos.jpg"),
    ],
  },
  "Nha Trang": {
    cover: { src: "/images/tours/nhatrang.jpg" },
    gallery: [
      { src: "/images/tours/nhatrang.jpg" },
      photo("nha-trang-1.jpg", "Minh Duc Ly", "Public domain", "https://commons.wikimedia.org/wiki/File:H%C3%B2n_N%E1%BB%99i,_Nha_Trang_Bay,_Vietnam.jpg"),
      photo("nha-trang-2.jpg", "Ilse Reijs and Jan-Noud Hutten", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Vietnam_Nha_Trang_Scuba_Diving_2009_-_4163924256.jpg"),
    ],
  },
  "Sa Pa": {
    cover: { src: "/images/tours/sapa.jpg" },
    gallery: [
      { src: "/images/tours/sapa.jpg" },
      photo("sa-pa-1.jpg", "Jakub Hałun", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Road_and_paddy_fields_in_Sa_Pa,_Vietnam,_20240126_1203_3590.jpg"),
      photo("sa-pa-2.jpg", "Christophe95", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:Rice_terraces_in_Sa_Pa_08.jpg"),
    ],
  },
  "Hạ Long": {
    cover: { src: "/images/tours/halong.jpg" },
    gallery: [
      { src: "/images/tours/halong.jpg" },
      photo("ha-long-1.jpg", "lumoplank", "CC0", "https://commons.wikimedia.org/wiki/File:Ha_Long_Bay_-_Halong1407.jpg"),
      photo("ha-long-2.jpg", "shankar s. from Dubai, united arab emirates", "CC BY 2.0", "https://commons.wikimedia.org/wiki/File:Zooming_to_the_karst_mountains_at_Ha_Long,_cutting_out_all_the_boats_(31598851276).jpg"),
    ],
  },
};

// Ảnh minh họa dùng khi điểm đến chưa có ảnh riêng.
export const FALLBACK_IMAGE = { src: "/images/coast.svg" };

// Lấy ảnh bìa và bộ sưu tập theo tên điểm đến (không có thì dùng ảnh minh họa).
export function imagesFor(destination) {
  return destinationImages[destination] || { cover: FALLBACK_IMAGE, gallery: [FALLBACK_IMAGE] };
}
