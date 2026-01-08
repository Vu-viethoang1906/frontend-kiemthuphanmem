#!/bin/bash
set -e  # Dừng script nếu có lỗi

# ==============================
# 🧱 Cấu hình biến môi trường
# ==============================
COMPOSE_FILE="docker-compose.yml"
COMPOSE_FILE_TEST="docker-compose.test.yml"

# Biến môi trường FE/BE
export REACT_APP_API_URL="http://app:3000/api"
export REACT_APP_SOCKET_URL="http://51.79.134.45:3005/api"
export REACT_APP_MODE="development"

echo "==============================="
echo "🚀 START PIPELINE (local bash)"
echo "==============================="

# ==============================
# 🧹 Dọn dẹp Docker cũ
# ==============================
echo "🧹 Cleaning old Docker containers, images, volumes..."
docker compose -f "$COMPOSE_FILE" down -v --rmi all --remove-orphans || true
docker compose -f "$COMPOSE_FILE_TEST" down -v --rmi all --remove-orphans || true
docker system prune -f || true

# ==============================
# 🧪 Build & Run Test Environment
# ==============================
# echo "🐳 Building & running Test Docker environment..."
# docker compose -f "$COMPOSE_FILE_TEST" up -d --build
# sleep 10
# docker compose -f "$COMPOSE_FILE_TEST" ps

# ==============================
# ✅ Run Tests
# ==============================
echo "✅ Running automated tests..."
# Thêm lệnh test nếu có, ví dụ:
# docker exec test-container npm run test

# ==============================
# 🧹 Clean Test Environment
# ==============================
echo "🧹 Cleaning Test Docker environment..."
echo "REACT_APP_API_URL=$REACT_APP_API_URL"
echo "REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL"
docker compose -f "$COMPOSE_FILE_TEST" down -v --rmi all --remove-orphans || true

# ==============================
# 🚀 Build & Run Production
# ==============================
echo "🚀 Building & running Production Docker environment..."
docker compose -f "$COMPOSE_FILE" up -d --build
sleep 10
docker compose -f "$COMPOSE_FILE" ps

# ==============================
# 📋 Check status
# ==============================
echo "📋 Checking running containers..."
docker ps -a

echo "✅ Pipeline finished successfully!"
echo "🧾 Pipeline ended."
