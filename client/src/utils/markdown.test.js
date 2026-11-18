// Test bộ đọc Markdown của blog. Quan trọng nhất là phần bảo mật: nội dung bài viết không được chạy mã.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parseInline, parseMarkdown, safeUrl } from "./markdown.js";

describe("safeUrl: chỉ cho link http(s) và link nội bộ", () => {
  test("cho qua link an toàn", () => {
    assert.equal(safeUrl("https://example.com/a?b=1"), "https://example.com/a?b=1");
    assert.equal(safeUrl("http://example.com"), "http://example.com");
    assert.equal(safeUrl("/quiz"), "/quiz");
    assert.equal(safeUrl("  /blog/bai-viet  "), "/blog/bai-viet");
  });

  test("chặn các kiểu link nguy hiểm", () => {
    for (const bad of ["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<script>1</script>", "//trang-la.example", "vbscript:x", "", "ftp://x"]) {
      assert.equal(safeUrl(bad), null, `phải chặn: ${bad}`);
    }
  });
});

describe("parseInline", () => {
  test("nhận ra chữ đậm, nghiêng và link", () => {
    const parts = parseInline("Đi **Hội An** và *Huế*, xem [quiz](/quiz)");
    assert.deepEqual(parts.map((p) => p.type), ["text", "strong", "text", "em", "text", "link"]);
    assert.equal(parts[1].text, "Hội An");
    assert.deepEqual(parts[5], { type: "link", text: "quiz", href: "/quiz" });
  });

  test("link không an toàn chỉ còn lại phần chữ, không có href", () => {
    const [part] = parseInline("[bấm vào](javascript:alert(1))");
    assert.deepEqual(part, { type: "text", text: "bấm vào" });
  });

  test("HTML không được hiểu: thẻ script vẫn là chữ thường", () => {
    const parts = parseInline("<script>alert(1)</script> và <img src=x onerror=alert(1)>");
    assert.ok(parts.every((p) => p.type === "text"));
  });
});

describe("parseMarkdown", () => {
  test("tiêu đề có id không dấu và id không bị trùng", () => {
    const blocks = parseMarkdown("## Buổi sáng: phố cổ\n\n## Mở đầu\n\n## Mở đầu\n\n### Mục nhỏ");
    assert.deepEqual(blocks.map((b) => [b.type, b.id]), [["h2", "buoi-sang-pho-co"], ["h2", "mo-dau"], ["h2", "mo-dau-2"], ["h3", "muc-nho"]]);
  });

  test("danh sách, danh sách số giữ số bắt đầu, trích dẫn và đường kẻ", () => {
    const blocks = parseMarkdown("- một\n- hai\n\n3. ba\n4. bốn\n\n> Lưu ý nhỏ\n\n---");
    assert.deepEqual(blocks[0], { type: "ul", items: ["một", "hai"] });
    assert.deepEqual(blocks[1], { type: "ol", start: 3, items: ["ba", "bốn"] });
    assert.deepEqual(blocks[2], { type: "quote", text: "Lưu ý nhỏ" });
    assert.equal(blocks[3].type, "hr");
  });

  test("nhiều dòng liền nhau gộp thành một đoạn, dòng trống tách đoạn", () => {
    const blocks = parseMarkdown("Dòng một\nDòng hai\n\nĐoạn khác");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0].text, "Dòng một Dòng hai");
  });

  test("ảnh: nhận ảnh an toàn, không bao giờ tạo ảnh từ link nguy hiểm", () => {
    const blocks = parseMarkdown("![Phố cổ](/images/a.jpg)\n\n![xấu](javascript:alert1)\n\n![xấu hai](javascript:alert(1))");
    const images = blocks.filter((b) => b.type === "image");
    assert.deepEqual(images, [{ type: "image", alt: "Phố cổ", src: "/images/a.jpg" }]);
  });

  test("xuống dòng kiểu Windows (CRLF) vẫn đọc đúng", () => {
    const blocks = parseMarkdown("## Tiêu đề\r\n\r\nNội dung\r\n- a\r\n- b");
    assert.deepEqual(blocks.map((b) => b.type), ["h2", "p", "ul"]);
  });

  test("nội dung rỗng hoặc toàn khoảng trắng không gây lỗi", () => {
    assert.deepEqual(parseMarkdown(""), []);
    assert.deepEqual(parseMarkdown("   \n\n  "), []);
    assert.deepEqual(parseMarkdown(undefined), []);
  });
});
