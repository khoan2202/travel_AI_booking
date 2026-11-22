// Điểm vào của backend khi deploy trên Vercel: toàn bộ app Express chạy như một Serverless Function.
// vercel.json chuyển mọi request /api/*, /api-docs về đây; giao diện React (client/dist) do Vercel tự phục vụ.
// Chạy trên máy (npm run dev) thì vẫn dùng server/src/server.js.
import { createApp } from '../server/src/app.js';

export default createApp();
