// Đọc nội dung bài viết viết bằng Markdown đơn giản và chuyển thành danh sách khối.
// Không dùng thư viện và không chèn HTML thô, nên nội dung bài viết không thể chạy mã độc.
// Hỗ trợ: ## tiêu đề, ### tiêu đề nhỏ, - danh sách, 1. danh sách số, > trích dẫn,
// ![mô tả](ảnh), --- đường kẻ, **đậm**, *nghiêng*, [chữ](link).
import { slugify } from "./blog.js";

// Chỉ cho phép link http(s) và link nội bộ. Chặn javascript: và //trang-la.com.
export function safeUrl(url) {
  const value = String(url).trim();
  return /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) ? value : null;
}

// Tách một dòng chữ thành các đoạn: chữ thường, đậm, nghiêng, link.
export function parseInline(text) {
  const pattern = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push({ type: "text", text: text.slice(last, match.index) });
    if (match[1]) parts.push({ type: "strong", text: match[1] });
    else if (match[2]) parts.push({ type: "em", text: match[2] });
    else {
      const href = safeUrl(match[4]);
      // Link không an toàn thì chỉ giữ lại phần chữ.
      parts.push(href ? { type: "link", text: match[3], href } : { type: "text", text: match[3] });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

// Chuyển toàn bộ bài viết thành danh sách khối để component hiển thị.
export function parseMarkdown(source) {
  const lines = String(source).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  const usedIds = new Map();
  // Tạo id cho tiêu đề; hai tiêu đề trùng tên thì thêm số phía sau.
  const headingId = (text) => {
    const base = slugify(text) || "muc";
    const seen = usedIds.get(base) || 0;
    usedIds.set(base, seen + 1);
    return seen ? `${base}-${seen + 1}` : base;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: heading[1].length === 2 ? "h2" : "h3", text: heading[2], id: headingId(heading[2]) });
      continue;
    }
    if (/^-{3,}$/.test(line)) { blocks.push({ type: "hr" }); continue; }

    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (image) {
      const src = safeUrl(image[2]);
      if (src) blocks.push({ type: "image", alt: image[1], src });
      continue;
    }

    // Các dòng liền nhau cùng loại được gom thành một khối.
    const collect = (pattern) => {
      const items = [];
      while (i < lines.length && pattern.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(pattern, ""));
        i += 1;
      }
      i -= 1;
      return items;
    };
    if (/^>\s?/.test(line)) { blocks.push({ type: "quote", text: collect(/^>\s?/).join(" ") }); continue; }
    if (/^[-*]\s+/.test(line)) { blocks.push({ type: "ul", items: collect(/^[-*]\s+/) }); continue; }
    if (/^\d+\.\s+/.test(line)) {
      // Giữ số bắt đầu, vì danh sách có thể bị ngắt bởi tiêu đề rồi đánh số tiếp.
      const start = Number(line.match(/^\d+/)[0]);
      blocks.push({ type: "ol", start, items: collect(/^\d+\.\s+/) });
      continue;
    }

    // Còn lại là đoạn văn: gom các dòng cho tới khi gặp dòng trống hoặc khối khác.
    const paragraph = [line];
    while (i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (!next || /^(#{2,3}\s|>|[-*]\s|\d+\.\s|!\[|-{3,}$)/.test(next)) break;
      paragraph.push(next);
      i += 1;
    }
    blocks.push({ type: "p", text: paragraph.join(" ") });
  }
  return blocks;
}
