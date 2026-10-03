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
import "./App.css";
import "./styles/tour-detail.css";
import "./styles/auth.css";

export default function App() {
  return <BrowserRouter><AuthProvider><ScrollToSection /><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/tours/:id" element={<TourDetailPage />} />
    <Route path="/login" element={<AuthPage key="login" mode="login" />} />
    <Route path="/register" element={<AuthPage key="register" mode="register" />} />
    <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AuthProvider></BrowserRouter>;
}
