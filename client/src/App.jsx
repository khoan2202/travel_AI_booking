// Danh sách các trang của web và đường dẫn của từng trang.
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
// lưới điểm đến, bộ ảnh, lightbox
import "./styles/gallery.css";
// quiz, so sánh, nguồn ảnh
import "./styles/quiz.css";
import "./styles/compare.css";
// blog và các trang quản trị thêm
import "./styles/blog.css";
import "./styles/admin-pro.css";
// hiệu ứng chuyển động, import sau để ghi đè style ở trên khi cần
import "./styles/motion.css";
// banner 3D, phải sau motion.css vì ghi đè vài thuộc tính của banner
import "./styles/hero3d.css";
// giao diện tối, để cuối cùng để ghi đè màu của mọi file trên
import "./styles/theme.css";
import MotionLayer from "./components/MotionLayer.jsx";
import CompareProvider from "./context/CompareProvider.jsx";
import CompareTray from "./components/CompareTray.jsx";
import QuizPage from "./pages/QuizPage.jsx";
import ComparePage from "./pages/ComparePage.jsx";
import CreditsPage from "./pages/CreditsPage.jsx";
import BlogPage from "./pages/BlogPage.jsx";
import BlogPostPage from "./pages/BlogPostPage.jsx";
import AdminBlogPage from "./pages/AdminBlogPage.jsx";
import AdminBlogEditorPage from "./pages/AdminBlogEditorPage.jsx";
import AdminUsersPage from "./pages/AdminUsersPage.jsx";
import AdminSupportPage from "./pages/AdminSupportPage.jsx";
import AdminActivityPage from "./pages/AdminActivityPage.jsx";

// BrowserRouter lo URL, AuthProvider chia sẻ trạng thái đăng nhập, CompareProvider giữ các tour đang so sánh
// (CompareTray là khay nổi ở đáy màn hình), ScrollToSection cuộn tới #id, MotionLayer lo hiệu ứng cuộn.
export default function App() {
  return <BrowserRouter><AuthProvider><CompareProvider><ScrollToSection /><MotionLayer /><CompareTray /><Routes>
    {/* Quiz tìm chuyến đi, so sánh tour, nguồn ảnh: ai cũng dùng được */}
    <Route path="/quiz" element={<QuizPage />} />
    <Route path="/compare" element={<ComparePage />} />
    <Route path="/credits" element={<CreditsPage />} />
    {/* Blog: ai cũng đọc được */}
    <Route path="/blog" element={<BlogPage />} />
    <Route path="/blog/:slug" element={<BlogPostPage />} />
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
    <Route path="/admin/blog" element={<ProtectedRoute adminOnly><AdminBlogPage /></ProtectedRoute>} />
    <Route path="/admin/blog/new" element={<ProtectedRoute adminOnly><AdminBlogEditorPage /></ProtectedRoute>} />
    <Route path="/admin/blog/:id" element={<ProtectedRoute adminOnly><AdminBlogEditorPage /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
    <Route path="/admin/support" element={<ProtectedRoute adminOnly><AdminSupportPage /></ProtectedRoute>} />
    <Route path="/admin/activity" element={<ProtectedRoute adminOnly><AdminActivityPage /></ProtectedRoute>} />
    {/* Trang Liên hệ: ai cũng gửi được */}
    <Route path="/contact" element={<ContactPage />} />
    {/* Đặt tour và xem đơn của tôi: cần đăng nhập */}
    <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
    <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
    <Route path="/my-bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
    {/* Đường dẫn không khớp trang nào: hiện trang 404 */}
    <Route path="*" element={<NotFoundPage />} />
  </Routes></CompareProvider></AuthProvider></BrowserRouter>;
}
