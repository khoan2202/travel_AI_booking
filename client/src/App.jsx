import { BrowserRouter, Route, Routes } from "react-router";
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
import "./App.css";
import "./styles/tour-detail.css";
import "./styles/auth.css";
import "./styles/booking.css";
import "./styles/admin.css";

export default function App() {
  return <BrowserRouter><AuthProvider><ScrollToSection /><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/tours/:id" element={<TourDetailPage />} />
    <Route path="/login" element={<AuthPage key="login" mode="login" />} />
    <Route path="/register" element={<AuthPage key="register" mode="register" />} />
    <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
    <Route path="/admin/tours" element={<ProtectedRoute adminOnly><AdminToursPage /></ProtectedRoute>} />
    <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><AdminBookingsPage /></ProtectedRoute>} />
    <Route path="/admin/bookings/:id" element={<ProtectedRoute adminOnly><AdminBookingDetailPage /></ProtectedRoute>} />
    <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
    <Route path="/my-bookings" element={<ProtectedRoute><MyBookingsPage /></ProtectedRoute>} />
    <Route path="/my-bookings/:id" element={<ProtectedRoute><BookingDetailPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AuthProvider></BrowserRouter>;
}
