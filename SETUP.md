# 🚀 Frontend Setup Guide

Hướng dẫn clone và chạy dự án Frontend sau khi clone từ GitHub.

## 📋 Yêu cầu hệ thống

- Node.js >= 16.x
- npm >= 8.x hoặc yarn

## 🔧 Các bước setup

### 1. Clone repository

```bash
git clone https://github.com/Vu-viethoang1906/frontend-kiemthuphanmem.git
cd frontend-kiemthuphanmem
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo file `.env`

Copy file `.env.example` thành `.env`:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### 4. Cấu hình biến môi trường

Mở file `.env` và điền các giá trị:

```env
REACT_APP_API_URL=http://localhost:3005/api
REACT_APP_SOCKET_URL=http://localhost:3005/api
REACT_APP_SOCKET=http://localhost:3005
REACT_APP_MODE=development
REACT_APP_GROQ_API_KEY=your_groq_api_key_here  # Optional
```

**Lưu ý:**
- `REACT_APP_API_URL`: URL của backend API (mặc định: `http://localhost:3005/api`)
- `REACT_APP_SOCKET_URL`: URL của Socket.IO server (mặc định: `http://localhost:3005/api`)
- `REACT_APP_SOCKET`: Base URL cho Socket connection (mặc định: `http://localhost:3005`)
- `REACT_APP_GROQ_API_KEY`: Chỉ cần nếu bạn sử dụng tính năng AI (có thể để trống)

### 5. Chạy ứng dụng

```bash
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 🧪 Chạy tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:ci

# Chạy E2E tests với Cypress
npm run cypress:open
```

## 🐛 Troubleshooting

### Lỗi "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 đã được sử dụng
- Đổi port trong `.env`: Thêm `PORT=3001` (hoặc port khác)
- Hoặc tắt process đang dùng port 3000

### Lỗi kết nối API
- Kiểm tra backend đã chạy chưa (`http://localhost:3005`)
- Kiểm tra `REACT_APP_API_URL` trong `.env` đúng chưa

## 📚 Scripts có sẵn

- `npm start` - Chạy development server
- `npm test` - Chạy tests
- `npm run test:ci` - Chạy tests với coverage (CI mode)
- `npm run build` - Build production
- `npm run cypress:open` - Mở Cypress E2E tests
- `npm run format` - Format code với Prettier

