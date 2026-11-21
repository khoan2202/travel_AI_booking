// Test thuật toán chấm điểm của Quiz tìm chuyến đi.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, scoreTours } from "./quiz.js";

const tour = (id, extra) => ({ id, title: `Tour ${id}`, tags: [], price_from: "3000000", duration_days: 3, departure_location: "TP. Hồ Chí Minh", ...extra });
const tours = [
  tour(1, { tags: ["biển", "nghỉ dưỡng"], price_from: "2200000" }),
  tour(2, { tags: ["núi", "thiên nhiên"], price_from: "5500000", duration_days: 4, departure_location: "Hà Nội" }),
  tour(3, { tags: ["văn hóa", "lịch sử"], price_from: "3500000" }),
];

describe("bộ câu hỏi", () => {
  test("mỗi câu có ít nhất 2 lựa chọn, giá trị lựa chọn không trùng nhau", () => {
    for (const question of QUESTIONS) {
      assert.ok(question.options.length >= 2, question.id);
      const values = question.options.map((o) => o.value);
      assert.equal(new Set(values).size, values.length, `trùng giá trị trong ${question.id}`);
    }
  });
});

describe("scoreTours", () => {
  const seaCouple = { scene: "sea", company: "couple", days: "3", budget: "mid", joy: "relax", from: "hcm" };

  test("tour khớp mọi tiêu chí đứng đầu với điểm cao, có lý do giải thích", () => {
    const result = scoreTours(tours, seaCouple);
    assert.equal(result[0].tour.id, 1);
    assert.ok(result[0].score >= 90 && result[0].score <= 100, `điểm ${result[0].score}`);
    assert.ok(result[0].reasons.length > 0 && result[0].reasons.length <= 3);
  });

  test("kết quả sắp xếp giảm dần theo điểm", () => {
    const scores = scoreTours(tours, seaCouple).map((r) => r.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  });

  test("vượt ngân sách bị trừ điểm, vượt quá nhiều còn bị trừ nặng hơn", () => {
    const within = scoreTours([tour(1, { price_from: "2000000" })], { budget: "low" })[0].score;
    const slightlyOver = scoreTours([tour(1, { price_from: "2800000" })], { budget: "low" })[0].score;
    const wayOver = scoreTours([tour(1, { price_from: "9000000" })], { budget: "low" })[0].score;
    assert.ok(within > slightlyOver && slightlyOver > wayOver);
  });

  test("điểm của tour không bao giờ ra ngoài khoảng 0–100", () => {
    const answers = { scene: "adventure", company: "family", days: "2", budget: "low", joy: "new", from: "hn" };
    for (const { score } of scoreTours(tours, answers)) assert.ok(score >= 0 && score <= 100);
  });

  test("bằng điểm thì tour rẻ hơn đứng trước", () => {
    const same = [tour(10, { price_from: "4000000" }), tour(11, { price_from: "3000000" })];
    const result = scoreTours(same, {});
    assert.equal(result[0].tour.id, 11);
  });

  test("chưa trả lời câu nào hoặc tour không có tag: vẫn trả đủ danh sách, không lỗi", () => {
    assert.equal(scoreTours(tours, {}).length, 3);
    assert.equal(scoreTours([{ id: 9, price_from: null, duration_days: 2 }], seaCouple).length, 1);
    assert.deepEqual(scoreTours([], seaCouple), []);
  });

  test("không làm thay đổi danh sách tour truyền vào", () => {
    const copy = JSON.stringify(tours);
    scoreTours(tours, seaCouple);
    assert.equal(JSON.stringify(tours), copy);
  });
});
