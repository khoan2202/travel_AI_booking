// Test đơn vị: hàm kiểm tra dữ liệu và đường lui của trợ lý AI. Không cần DB, không gọi mạng.
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { AdminError, check, date, integer, text } from "../src/services/adminCommon.js";
import { positiveId } from "../src/services/bookingService.js";
import { consult, dataFallback } from "../src/services/consultationService.js";

describe("kiểm tra dữ liệu (adminCommon)", () => {
  test("integer: chấp nhận số nguyên trong khoảng, từ chối phần còn lại", () => {
    assert.equal(integer(5, 1, 10), true);
    assert.equal(integer("7", 1, 10), true);
    assert.equal(integer(0, 1, 10), false);
    assert.equal(integer(11, 1, 10), false);
    assert.equal(integer(1.5), false);
    assert.equal(integer("1e3"), false);
    assert.equal(integer(true), false);
    assert.equal(integer(null), false);
  });

  test("text: cắt khoảng trắng và kiểm tra độ dài", () => {
    assert.equal(text("  Hội An  ", 2, 20, "Tên"), "Hội An");
    assert.throws(() => text("a", 2, 20, "Tên"), AdminError);
    assert.throws(() => text(123, 1, 5, "Tên"), AdminError);
    assert.throws(() => text("x".repeat(21), 1, 20, "Tên"), /từ 1 đến 20 ký tự/);
  });

  test("date: loại ngày không tồn tại và sai định dạng", () => {
    assert.equal(date("2026-12-20"), "2026-12-20");
    assert.throws(() => date("2026-02-31"), /không tồn tại/);
    assert.throws(() => date("20/12/2026"), /YYYY-MM-DD/);
  });

  test("check: lỗi mang đúng mã HTTP", () => {
    assert.throws(() => check(false, "Không thấy", 404), (error) => error.status === 404 && error.message === "Không thấy");
    assert.doesNotThrow(() => check(true, "ok"));
  });

  test("positiveId: chỉ nhận ID nguyên dương vừa INTEGER của PostgreSQL", () => {
    assert.equal(positiveId("42"), 42);
    assert.equal(positiveId("0"), null);
    assert.equal(positiveId("-3"), null);
    assert.equal(positiveId("007"), null);
    assert.equal(positiveId("2147483648"), null);
    assert.equal(positiveId("1; DROP TABLE users"), null);
  });
});

describe("trợ lý AI (consult) và phương án dự phòng", () => {
  const catalog = [
    { id: 1, title: "Tour A", price_from: "1000000" },
    { id: 2, title: "Tour B", price_from: "2000000" },
    { id: 3, title: "Tour C", price_from: "3000000" },
    { id: 4, title: "Tour D", price_from: "4000000" },
  ];
  const input = { message: "Tôi muốn đi biển", history: [], filters: {}, catalog };
  // "Gemini giả" trả về đúng nội dung mình muốn
  const fakeGemini = (output, ok = true) => async () => ({
    ok,
    status: ok ? 200 : 503,
    json: async () => ({ candidates: [{ content: { parts: [{ text: typeof output === "string" ? output : JSON.stringify(output) }] } }] }),
  });
  let savedKey;
  beforeEach(() => { savedKey = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = "khoa-gia-de-test"; });
  afterEach(() => { if (savedKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = savedKey; });

  test("chưa có API key: trả 3 tour đầu từ database, không gọi AI", async () => {
    delete process.env.GEMINI_API_KEY;
    let called = false;
    const result = await consult(input, async () => { called = true; });
    assert.equal(called, false);
    assert.equal(result.source, "database");
    assert.equal(result.recommendations.length, 3);
  });

  test("AI trả kết quả hợp lệ: ghép lý do của AI với dữ liệu tour thật", async () => {
    const result = await consult(input, fakeGemini({ answer: "Mình gợi ý Tour B.", recommendations: [{ tour_id: 2, reason: "Hợp đi biển" }] }));
    assert.equal(result.source, "gemini");
    assert.equal(result.recommendations[0].title, "Tour B");
    assert.equal(result.recommendations[0].reason, "Hợp đi biển");
  });

  test("AI bịa tour không có trong danh sách: bỏ kết quả, dùng dự phòng", async () => {
    const result = await consult(input, fakeGemini({ answer: "Thử tour này", recommendations: [{ tour_id: 999, reason: "bịa" }] }));
    assert.equal(result.source, "database");
  });

  test("AI trả quá 3 tour hoặc trùng tour: dùng dự phòng", async () => {
    const four = [1, 2, 3, 4].map((tour_id) => ({ tour_id, reason: "ok" }));
    assert.equal((await consult(input, fakeGemini({ answer: "x", recommendations: four }))).source, "database");
    const twice = [{ tour_id: 1, reason: "ok" }, { tour_id: 1, reason: "ok" }];
    assert.equal((await consult(input, fakeGemini({ answer: "x", recommendations: twice }))).source, "database");
  });

  test("AI trả JSON hỏng hoặc lỗi HTTP hoặc quá giờ: người dùng vẫn nhận gợi ý", async () => {
    assert.equal((await consult(input, fakeGemini("không phải JSON {"))).source, "database");
    assert.equal((await consult(input, fakeGemini({}, false))).source, "database");
    const timeout = async () => { throw Object.assign(new Error("hết giờ"), { name: "TimeoutError" }); };
    assert.equal((await consult(input, timeout)).source, "database");
  });

  test("tên model lạ bị từ chối để không chèn được vào URL", async () => {
    process.env.GEMINI_MODEL = "../../evil";
    let called = false;
    const result = await consult(input, async () => { called = true; });
    delete process.env.GEMINI_MODEL;
    assert.equal(called, false);
    assert.equal(result.source, "database");
  });

  test("dataFallback: danh sách rỗng thì báo chưa có tour phù hợp", () => {
    const result = dataFallback([]);
    assert.equal(result.recommendations.length, 0);
    assert.match(result.answer, /Chưa có tour/);
  });
});
