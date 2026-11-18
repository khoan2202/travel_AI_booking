// Điểm vào của frontend: gắn React vào <div id="root"> trong index.html.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// StrictMode chỉ có tác dụng lúc dev: React cố ý chạy vài đoạn hai lần để lòi lỗi sớm
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);