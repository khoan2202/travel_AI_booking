// Câu hỏi và cách chấm điểm của Quiz. Chấm ngay trên trình duyệt từ danh sách tour đang bán, không gọi AI nên miễn phí.
//
// Mỗi lựa chọn có thể có:
//   tags: điểm cho các tag của tour (số âm là không hợp, vd đi với trẻ nhỏ thì trừ "phiêu lưu")
//   days / atLeast: số ngày muốn đi; max: ngân sách tối đa một người; from: nơi xuất phát
//   reason: câu giải thích hiện ở kết quả khi tour khớp tag của lựa chọn này
// Thêm câu hỏi thì thêm một mục vào QUESTIONS, tag nên dùng đúng tag có trong tour.

export const QUESTIONS = [
  {
    id: "scene",
    title: "Bạn mơ về khung cảnh nào?",
    hint: "Chọn điều đầu tiên hiện ra trong đầu bạn.",
    options: [
      { value: "sea", icon: "🌊", label: "Biển xanh, cát trắng", tags: { "biển": 3, "nghỉ dưỡng": 1 }, reason: "Có biển xanh đúng như bạn mơ" },
      { value: "mountain", icon: "⛰️", label: "Núi rừng, mây trời", tags: { "núi": 3, "thiên nhiên": 2 }, reason: "Núi rừng, thiên nhiên đúng gu bạn" },
      { value: "culture", icon: "🏮", label: "Phố cổ, di sản", tags: { "văn hóa": 3, "lịch sử": 2 }, reason: "Đậm chất văn hóa và di sản" },
      { value: "river", icon: "🛶", label: "Sông nước, miệt vườn", tags: { "sông nước": 3, "văn hóa": 1, "ẩm thực": 1 }, reason: "Trải nghiệm sông nước miệt vườn" },
      { value: "adventure", icon: "🧗", label: "Hang động, khám phá", tags: { "hang động": 3, "phiêu lưu": 3, "núi": 1 }, reason: "Đủ chất phiêu lưu bạn muốn" },
    ],
  },
  {
    id: "company",
    title: "Bạn sẽ đi cùng ai?",
    hint: "Người đồng hành quyết định nhịp độ chuyến đi.",
    options: [
      { value: "solo", icon: "🎒", label: "Một mình", tags: { "phiêu lưu": 2, "nhiếp ảnh": 1, "văn hóa": 1 }, reason: "Hợp để tự do khám phá một mình" },
      { value: "couple", icon: "💞", label: "Người thương", tags: { "nghỉ dưỡng": 2, "nhiếp ảnh": 2, "biển": 1 }, reason: "Lãng mạn, hợp đi cùng người thương" },
      { value: "family", icon: "👨‍👩‍👧", label: "Gia đình", tags: { "gia đình": 3, "nghỉ dưỡng": 1, "phiêu lưu": -2 }, reason: "Phù hợp cả gia đình" },
      { value: "friends", icon: "🥳", label: "Nhóm bạn", tags: { "phiêu lưu": 2, "ẩm thực": 1, "biển": 1 }, reason: "Vui hết cỡ khi đi cùng nhóm bạn" },
    ],
  },
  {
    id: "days",
    title: "Bạn có bao nhiêu ngày?",
    hint: "Tính cả ngày đi và ngày về.",
    options: [
      { value: "2", icon: "🌙", label: "Cuối tuần (2 ngày)", days: 2 },
      { value: "3", icon: "☀️", label: "3 ngày", days: 3 },
      { value: "4", icon: "🗓️", label: "4 ngày trở lên", days: 4, atLeast: true },
      { value: "any", icon: "🤷", label: "Linh hoạt", days: null },
    ],
  },
  {
    id: "budget",
    title: "Ngân sách mỗi người khoảng bao nhiêu?",
    hint: "Giá tour đã gồm lịch trình, chưa gồm chi tiêu cá nhân.",
    options: [
      { value: "low", icon: "💵", label: "Dưới 2,5 triệu", max: 2500000 },
      { value: "mid", icon: "💳", label: "2,5 – 4 triệu", max: 4000000 },
      { value: "high", icon: "💰", label: "4 – 6 triệu", max: 6000000 },
      { value: "any", icon: "💎", label: "Không giới hạn", max: null },
    ],
  },
  {
    id: "joy",
    title: "Điều gì làm chuyến đi trọn vẹn?",
    hint: "Chọn thứ bạn sẽ nhớ nhất sau chuyến đi.",
    options: [
      { value: "food", icon: "🍜", label: "Ăn thật ngon", tags: { "ẩm thực": 3 }, reason: "Nhiều món ngon đáng thử" },
      { value: "photo", icon: "📸", label: "Ảnh thật đẹp", tags: { "nhiếp ảnh": 3, "thiên nhiên": 1 }, reason: "Rất nhiều góc chụp đẹp" },
      { value: "relax", icon: "🧘", label: "Thư giãn hoàn toàn", tags: { "nghỉ dưỡng": 3 }, reason: "Lịch trình thư thả, dễ nghỉ ngơi" },
      { value: "new", icon: "✨", label: "Trải nghiệm mới lạ", tags: { "phiêu lưu": 2, "văn hóa": 2, "hang động": 1 }, reason: "Nhiều trải nghiệm mới lạ" },
    ],
  },
  {
    id: "from",
    title: "Bạn khởi hành từ đâu?",
    hint: "Ưu tiên tour xuất phát gần bạn.",
    options: [
      { value: "hn", icon: "🏙️", label: "Hà Nội", from: "Hà Nội" },
      { value: "hcm", icon: "🌆", label: "TP. Hồ Chí Minh", from: "TP. Hồ Chí Minh" },
      { value: "any", icon: "🧭", label: "Đâu cũng được", from: null },
    ],
  },
];

// trọng số của điểm, cộng lại đủ 100
const WEIGHT = { tags: 45, budget: 25, days: 20, from: 10 };

const optionOf = (questionId, answers) =>
  QUESTIONS.find((q) => q.id === questionId)?.options.find((o) => o.value === answers[questionId]);

const formatMillion = (price) => `${(price / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} triệu`;

// trả danh sách đã xếp hạng: { tour, score (0-100), reasons[] }
export function scoreTours(tours, answers) {
  const chosen = QUESTIONS.map((q) => optionOf(q.id, answers)).filter(Boolean);

  // gộp điểm tag của mọi lựa chọn. Mẫu số là tổng 3 điểm dương lớn nhất, vì mỗi tour chỉ có chừng 3 tag
  const tagWeights = {};
  for (const option of chosen) {
    for (const [tag, weight] of Object.entries(option.tags || {})) tagWeights[tag] = (tagWeights[tag] || 0) + weight;
  }
  const top3 = Object.values(tagWeights).filter((w) => w > 0).sort((a, b) => b - a).slice(0, 3);
  const tagDenominator = top3.reduce((sum, w) => sum + w, 0) || 1;

  const days = optionOf("days", answers);
  const budget = optionOf("budget", answers);
  const from = optionOf("from", answers);

  return tours.map((tour) => {
    const tags = tour.tags || [];
    const price = Number(tour.price_from) || 0;
    const reasons = [];

    // 1. sở thích (tag)
    const matched = tags.reduce((sum, tag) => sum + (tagWeights[tag] || 0), 0);
    const tagScore = Math.max(0, Math.min(1, matched / tagDenominator));
    for (const option of chosen) {
      const hit = option.reason && tags.some((tag) => (option.tags?.[tag] || 0) > 0);
      if (hit) reasons.push(option.reason);
    }

    // 2. ngân sách: trong ngân sách thì đủ điểm, vượt không quá 20% thì nửa điểm
    let budgetScore = 1;
    if (budget?.max) {
      if (price <= budget.max) { budgetScore = 1; reasons.unshift(`Vừa ngân sách: chỉ từ ${formatMillion(price)}`); }
      else budgetScore = price <= budget.max * 1.2 ? 0.5 : 0.1;
    }

    // 3. số ngày
    let daysScore = 1;
    if (days?.days) {
      const d = tour.duration_days;
      if (days.atLeast) daysScore = d >= days.days ? 1 : d === days.days - 1 ? 0.5 : 0.2;
      else daysScore = d === days.days ? 1 : Math.abs(d - days.days) === 1 ? 0.55 : 0.15;
      if (daysScore === 1) reasons.push(`Gọn trong ${d} ngày như bạn muốn`);
    }

    // 4. nơi xuất phát
    let fromScore = 1;
    if (from?.from) {
      fromScore = tour.departure_location === from.from ? 1 : 0.35;
      if (fromScore === 1) reasons.push(`Khởi hành ngay từ ${from.from}`);
    }

    const score = Math.round(
      WEIGHT.tags * tagScore + WEIGHT.budget * budgetScore + WEIGHT.days * daysScore + WEIGHT.from * fromScore,
    );
    return { tour, score, reasons: [...new Set(reasons)].slice(0, 3) };
  }).sort((a, b) => b.score - a.score || Number(a.tour.price_from) - Number(b.tour.price_from));
}
