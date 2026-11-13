// Khai báo toàn bộ các trang (route) của website và đường dẫn tương ứng.
import { BrowserRouter, Route, Routes } from "react-router";
import RecommendationPage from "./pages/RecommendationPage.jsx";
import "./styles/ai.css";
import HomePage from "./pages/HomePage.jsx";
import TourDetailPage from "./pages/TourDetailPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ScrollToSection from "./components/ScrollToSection.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AuthProvider from "./context/AuthProvider.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import MyBookingsPage from "./pages/MyBookingsPage.jsx";
import BookingDetailPage from "./pages/BookingDetailPage.jsx";
import AdminToursPage from "./pages/AdminToursPage.jsx";
import AdminBookingsPage from "./pages/AdminBookingsPage.jsx";
import AdminBookingDetailPage from "./pages/AdminBookingDetailPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import "./App.css";
import "./styles/tour-detail.css";
import "./styles/auth.css";
import "./styles/booking.css";
import "./styles/admin.css";

// BrowserRouter: quản lý URL. AuthProvider: chia sẻ trạng thái đăng nhập cho mọi trang.
// ScrollToSection: tự cuộn tới mục khi URL có #id.
export default function App() {
  return <BrowserRouter><AuthProvider><ScrollToSection /><Routes>
    {/* Trang công khai: trang chủ, gợi ý tour, chi tiết tour */}
    <Route path="/" element={<HomePage />} />
    <Route path="/recommendations" element={<RecommendationPage />} />
    <Route path="/tours/:id" element={<TourDetailPage />} />
    {/* Đăng nhập / đăng ký dùng chung một trang. key khác nhau để React tạo lại trang khi đổi chế độ */}
    <Route path="/login" element={<AuthPage key="login" mode="login" />} />
    <Route path="/register" element={<AuthPage key="register" mode="register" />} />
    {/* ProtectedRoute: phải đăng nhập mới vào được; thêm adminOnly thì chỉ admin mới vào được */}
    <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
    <Route path="/admin/tours" element={<ProtectedRoute adminOnly><AdminToursPage /></ProtectedRoute>} />
    <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><AdminBookingsPage /></ProtectedRoute>} />
    <Route path="/admin/bookings/:id" element={<ProtectedRoute adminOnly><AdminBookingDetailPage /></ProtectedRoute>} />
    {/* Trang Liên hệ: ai cũng gửi được */}
    <Route path="/contact" element={<ContactPage />} />
    {/* Đặt tour và xem đơn của tôi: cần đăng nhập */}
    <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
    <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
    <Route path="/my-bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
    {/* Đường dẫn không khớp trang nào: hiện trang 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AuthProvider></BrowserRouter>;
}
