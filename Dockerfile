# # ======= Build Stage =======
# FROM node:18-alpine AS build

# WORKDIR /app

# ARG REACT_APP_API_URL
# ARG REACT_APP_SOCKET_URL
# ARG REACT_APP_MODE
# ARG REACT_APP_SOCKET

# ENV REACT_APP_API_URL=$REACT_APP_API_URL
# ENV REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL
# ENV REACT_APP_MODE=$REACT_APP_MODE
# ENV GENERATE_SOURCEMAP=false
# ENV REACT_APP_SOCKET=$REACT_APP_SOCKET
# ENV DISABLE_ESLINT_PLUGIN=true

# COPY package*.json ./

# RUN npm config set registry https://registry.npmmirror.com

# RUN npm install

# COPY . .
# RUN npm run build

# # ======= Run Stage =======
# FROM nginx:stable-alpine
# COPY --from=build /app/build /usr/share/nginx/html
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]




# =======================
# 1️⃣ Build Stage
# =======================
# Use BuildKit features when available (cache mounts) and keep image lightweight.
# If your Docker daemon supports BuildKit, it will use the cache mounts below.
# Tip: build with: DOCKER_BUILDKIT=1 docker build --progress=plain -t app:optimized .

# =======================
# 1) Deps stage (cache installs)
# =======================
FROM node:20-alpine AS deps
WORKDIR /app

# Copy only package files to leverage docker cache for dependencies
COPY package*.json ./

# Use a cache mount for npm's cache to speed repeated installs (BuildKit aware)
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm config set registry https://registry.npmmirror.com && \
    npm config set engine-strict false && \
    npm ci --legacy-peer-deps --prefer-offline --no-audit --no-fund --no-optional


# =======================
# 2) Build stage
# =======================
FROM node:20-alpine AS build
WORKDIR /app

# Bring dependencies from deps stage to avoid reinstalling
COPY --from=deps /app/node_modules ./node_modules

# Build-time environment variables (passed by build args)
ARG REACT_APP_API_URL
ARG REACT_APP_SOCKET_URL
ARG REACT_APP_MODE
ARG REACT_APP_SOCKET
ARG NODE_MEM=1024

# Limit Node memory during the build to avoid OOMs on constrained servers
ENV REACT_APP_API_URL=$REACT_APP_API_URL \
    REACT_APP_SOCKET_URL=$REACT_APP_SOCKET_URL \
    REACT_APP_MODE=$REACT_APP_MODE \
    REACT_APP_SOCKET=$REACT_APP_SOCKET \
    GENERATE_SOURCEMAP=false \
    DISABLE_ESLINT_PLUGIN=true \
    HUSKY=0 \
    CI=true \
    NODE_OPTIONS=--max_old_space_size=${NODE_MEM}

# Copy only what's required for a build
COPY package*.json ./
COPY public ./public
COPY src ./src
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY .env.example ./

# Run the production build using the (lowmem) environment limits above
# Use the explicit low-memory script to be extra-safe; can be overridden by setting
# the build arg `NODE_MEM` to a lower value when building on very constrained hosts.
RUN npm run build:prod:lowmem

# =======================
# 2️⃣ Runtime Stage (Nginx)
# =======================
FROM nginx:stable-alpine

# Xoá html cũ
RUN rm -rf /usr/share/nginx/html/*

# Copy build từ stage trước
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
