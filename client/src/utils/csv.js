// Tạo và tải file CSV ngay trên trình duyệt.

// Bọc một ô dữ liệu. Ô bắt đầu bằng = + - @ được thêm dấu ' phía trước,
// để Excel không hiểu nhầm nội dung khách nhập thành công thức (CSV injection).
function cell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

// rows: mảng các dòng, mỗi dòng là mảng ô. Thêm BOM để Excel đọc đúng tiếng Việt.
export function downloadCsv(filename, rows) {
  const content = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
