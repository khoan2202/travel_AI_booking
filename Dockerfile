# syntax=docker/dockerfile:1
# Một image chạy cả website: backend Express phục vụ luôn giao diện React đã build,
# nên chỉ cần một container và một domain (không phải cấu hình CORS giữa hai nơi).
#
# Build:  docker build -t travel-mint .
# Chạy thử cả hệ thống kèm PostgreSQL: xem docker-compose.yml (docker compose up --build)

# ---- Giai đoạn 1: build giao diện React ----
FROM node:24-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
# "/api": giao diện gọi API cùng domain với chính nó. Muốn trỏ tới backend khác thì
# truyền --build-arg VITE_API_BASE_URL=https://api.example.com/api
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---- Giai đoạn 2: cài thư viện backend, bỏ thư viện chỉ dùng khi phát triển ----
FROM node:24-alpine AS server-deps
# Một thư viện của Swagger UI gửi thống kê ẩn danh khi cài đặt; tắt đi cho build không gọi ra ngoài.
ENV SCARF_ANALYTICS=false
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# ---- Giai đoạn 3: image chạy thật, chỉ chứa những gì cần thiết ----
FROM node:24-alpine
# Mặc định là production: bắt buộc CLIENT_URL dùng https, DATABASE_SSL=true và cookie phiên "secure".
# Chạy thử trên http://localhost thì ghi đè NODE_ENV=development (docker-compose.yml đã làm sẵn).
ENV NODE_ENV=production \
    PORT=5000
WORKDIR /app
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist
# Không chạy bằng quyền root.
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
WORKDIR /app/server
CMD ["node", "src/server.js"]
