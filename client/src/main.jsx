// Điểm bắt đầu của frontend: gắn ứng dụng React vào thẻ <div id="root"> trong index.html.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// StrictMode chỉ chạy lúc dev: React chạy một số đoạn hai lần để phát hiện lỗi sớm.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);