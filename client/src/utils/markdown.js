// Tự đọc Markdown đơn giản thành các khối cho React vẽ. Không dùng thư viện và không bao giờ chèn HTML thô,
// nên bài viết không thể nhét mã chạy vào trang.
// Hiểu: ## và ### tiêu đề, - và 1. danh sách, > trích dẫn, ![mô tả](ảnh), ---, **đậm**, *nghiêng*, [chữ](link).
import { slugify } from "./blog.js";

// chỉ nhận http(s) và link nội bộ; javascript: và //trang-la.com thì chặn
export function safeUrl(url) {
  const value = String(url).trim();
  return /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value) ? value : null;
}

// tách một dòng thành đoạn: chữ thường, đậm, nghiêng, link
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
      // link không an toàn thì chỉ giữ chữ
      parts.push(href ? { type: "link", text: match[3], href } : { type: "text", text: match[3] });
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

// cả bài thành danh sách khối
export function parseMarkdown(source) {
  const lines = String(source ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  const usedIds = new Map();
  // id cho tiêu đề, trùng tên thì thêm số phía sau
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

    // các dòng liền nhau cùng loại gom thành một khối
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
      // giữ số bắt đầu, vì danh sách có thể bị tiêu đề ngắt giữa chừng rồi đánh số tiếp
      const start = Number(line.match(/^\d+/)[0]);
      blocks.push({ type: "ol", start, items: collect(/^\d+\.\s+/) });
      continue;
    }

    // còn lại là đoạn văn, gom tới khi gặp dòng trống hoặc khối khác
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
