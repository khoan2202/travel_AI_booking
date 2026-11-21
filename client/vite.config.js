// Cấu hình Vite (công cụ chạy dev server và build frontend).
// npm run dev: chạy ở http://localhost:5173; npm run build: xuất file vào client/dist.
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
