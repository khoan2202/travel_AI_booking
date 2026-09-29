import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [status, setStatus] = useState("Đang kiểm tra kết nối...");

  useEffect(() => {
    const controller = new AbortController();

    async function checkConnection() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/health",
          { signal: controller.signal }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Backend gặp lỗi");
        }

        setStatus(`${data.message} — ${data.database}`);
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus(`Kết nối thất bại: ${error.message}`);
        }
      }
    }

    checkConnection();

    return () => controller.abort();
  }, []);

  return (
    <main className="setup-page">
      <span className="badge">AI TRAVEL</span>
      <h1>Travel Tour Booking</h1>
      <p>Hệ thống đặt tour, tư vấn và gợi ý du lịch.</p>
      <div className="status" role="status">
        {status}
      </div>
    </main>
  );
}

export default App;