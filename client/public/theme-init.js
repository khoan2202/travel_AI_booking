// Chọn giao diện sáng/tối TRƯỚC KHI trang hiện ra, để không bị nháy trắng khi mở web ở chế độ tối.
// Phải là file riêng vì chính sách bảo mật (CSP) của website không cho chạy script viết thẳng trong HTML.
// Ưu tiên lựa chọn khách đã lưu; chưa chọn bao giờ thì theo cài đặt của máy.
(function () {
  var saved = null;
  try { saved = localStorage.getItem("travel.theme"); } catch { /* Trình duyệt chặn lưu trữ: theo cài đặt máy. */ }
  var system = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  var theme = saved === "dark" || saved === "light" ? saved : system;
  document.documentElement.setAttribute("data-theme", theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta && theme === "dark") meta.setAttribute("content", "#0b110f");
})();
