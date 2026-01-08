import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_SOCKET_URL
    ? `${process.env.REACT_APP_SOCKET_URL}`
    : 'http://localhost:3005/api',
});

// 👉 Gắn token vào request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Không set Content-Type nếu đang gửi FormData (browser sẽ tự động set với boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// 👉 Tự động refresh token nếu gặp lỗi 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 413) {
      window.location.href = '/maintenance.html';
      return Promise.reject(error);
    } else if (error.response?.status === 503) {
      // Có thể redirect đến maintenance.html
      window.location.href = '/maintenance.html';
      return Promise.reject(error);
    } else if (error.message === 'Network Error') {
      // Trường hợp preflight bị 503 hoặc server unreachable

      window.location.href = '/maintenance.html';
      return;
    }
    //Nếu bị 401 (hết hạn token) và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Gọi API refresh token
        const baseUrl = process.env.REACT_APP_SOCKET_URL
          ? `${process.env.REACT_APP_SOCKET_URL}`
          : 'http://localhost:3005/api';
        const res = await axios.post(`${baseUrl}/refresh-token`, {
          refreshToken,
          type: 'local', // hoặc "keycloak" nếu bạn có phân loại
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = res.data.data;

        // Lưu lại token mới
        localStorage.setItem('token', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Cập nhật lại header và gửi lại request cũ
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('⚠️ Refresh token failed:', refreshError);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
