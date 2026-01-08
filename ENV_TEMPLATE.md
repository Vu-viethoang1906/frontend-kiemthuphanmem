# Frontend Environment Variables Template

Copy nội dung dưới đây vào file `.env` (tạo mới nếu chưa có):

```env
# Frontend Environment Variables
# Copy this file to .env and fill in your actual values

# API Configuration
REACT_APP_API_URL=http://localhost:3005/api
REACT_APP_SOCKET_URL=http://localhost:3005/api
REACT_APP_SOCKET=http://localhost:3005

# Application Mode
REACT_APP_MODE=development

# Groq AI API Key (Optional - only if using AI features)
# Get your API key from: https://console.groq.com/
REACT_APP_GROQ_API_KEY=your_groq_api_key_here
```

## Hướng dẫn:

1. Tạo file `.env` trong thư mục gốc của project
2. Copy nội dung trên vào file `.env`
3. Thay `your_groq_api_key_here` bằng API key thật của bạn (nếu cần)
4. Điều chỉnh các URL nếu backend chạy ở port khác

