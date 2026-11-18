# 🌴 Travel Mint — Website đặt tour du lịch tích hợp AI

Website đặt tour du lịch fullstack: khách xem, so sánh và đặt tour; admin quản lý tour, đơn đặt, người dùng và blog; trợ lý AI (Google Gemini) gợi ý tour phù hợp với nhu cầu.

🔗 **Demo:** https://travel.trizportal.com/  ·  📘 **Tài liệu API (Swagger):** `https://travel.trizportal.com/api-docs`

<img width="2858" height="1442" alt="image" src="https://github.com/user-attachments/assets/1344d668-5cca-4fee-8d5e-c8aad8584e36" />


---

## ✨ Tính năng chính

**Khách hàng**
- Xem danh sách tour, lọc theo khu vực / ngân sách / số ngày, xem chi tiết và lịch khởi hành còn chỗ
- **So sánh tối đa 3 tour** cạnh nhau (link so sánh có thể gửi cho bạn bè)
- **Quiz tìm chuyến đi** và **trợ lý AI tư vấn tour** dựa trên catalog thật
- Đăng ký / đăng nhập, đặt tour, xem và hủy đơn của mình
- Đọc blog du lịch, gửi yêu cầu hỗ trợ

**Quản trị (admin)**
- Dashboard tổng quan và biểu đồ doanh thu
- Quản lý tour, đơn đặt (xác nhận thanh toán, xuất CSV), người dùng và phân quyền
- Xử lý yêu cầu hỗ trợ, soạn bài blog (Markdown)
- Nhật ký hoạt động: ghi lại mọi thao tác của admin

## 🛡️ Bảo mật

- Đăng nhập bằng session, mật khẩu băm bằng **bcrypt**, session lưu trong PostgreSQL
- **CSRF token** cho mọi request thay đổi dữ liệu
- **Rate limiting** riêng cho đăng nhập, đăng ký, đặt tour và gọi AI
- Security header, giới hạn kích thước request, phân quyền `user` / `admin` ở cả frontend và backend

## 🤖 Trợ lý AI

- Gọi Google Gemini với system prompt chỉ cho phép tư vấn tour **có trong database**, không bịa giá hay chính sách
- Ép kết quả trả về dạng JSON (câu trả lời + tối đa 3 tour kèm lý do)
- Chặn prompt injection, giới hạn 10 giây cho mỗi lần gọi
- **Phương án dự phòng:** khi AI lỗi hoặc chưa có API key, hệ thống tự gợi ý tour từ database, người dùng không thấy lỗi

## 🧰 Công nghệ

| Tầng | Công nghệ |
|------|-----------|
| Frontend | React 19, Vite, React Router, Context API, CSS thuần |
| Backend | Node.js 24, Express 5, REST API, Swagger UI |
| Database | PostgreSQL (Neon), 9 file migration SQL |
| AI | Google Gemini API |
| Deploy | Render (một service phục vụ cả frontend và `/api`) + Neon Postgres |

## 🗂️ Cấu trúc thư mục

```
travel_AI_booking/
├── client/                 # Frontend React
│   └── src/
│       ├── pages/          # 24 trang (khách + admin)
│       ├── components/     # Header, TourCard, CompareTray, RevenueChart...
│       ├── context/        # AuthContext, CompareContext
│       └── services/       # Gọi API (tourApi, bookingApi, adminApi...)
└── server/                 # Backend Express
    ├── sql/                # Migration 001 → 009 + script deploy
    └── src/
        ├── routes/         # 11 nhóm route
        ├── controllers/    # Xử lý request
        ├── services/       # Logic đặt tour, gợi ý, gọi AI
        ├── middleware/     # auth, csrf, security
        └── docs/openapi.js # Tài liệu Swagger
```

## 🚀 Chạy trên máy

**Yêu cầu:** Node.js 24, PostgreSQL (cài trên máy hoặc dùng Neon miễn phí).

```bash
# 1. Tạo database và chạy lần lượt các file trong server/sql (001 → 009)

# 2. Backend
cd server
cp .env.example .env      # điền thông tin PostgreSQL, SESSION_SECRET, GEMINI_API_KEY (không bắt buộc)
npm install
npm run dev               # http://localhost:5000

# 3. Frontend (mở terminal khác)
cd client
npm install
npm run dev               # http://localhost:5173
```

Tạo tài khoản admin: đăng ký bình thường rồi chạy
`UPDATE users SET role = 'admin' WHERE email = 'email-cua-ban';`

## 📄 Tác giả

**Phùng Khắc Khoan** — sinh viên Hệ thống Thông tin, Trường ĐH Công nghệ Thông tin (UIT – ĐHQG-HCM)
GitHub: [@khoan2202](https://github.com/khoan2202)
