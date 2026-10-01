import { BrowserRouter, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage.jsx";
import TourDetailPage from "./pages/TourDetailPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ScrollToSection from "./components/ScrollToSection.jsx";
import "./App.css";
import "./styles/tour-detail.css";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToSection />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
