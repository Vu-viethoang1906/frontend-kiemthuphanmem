import axios from "axios";
// api/auth.ts

// Lấy thông tin user theo userId
export const getUserProfile = async (userId: string) => {
  const apiAuth = apiWithAuth();
  const res = await apiAuth.post("/user/getprofile", { userId }); // sửa đoạn này
  // Nếu backend trả về { success, data }, lấy data
  if (res.data && res.data.success && res.data.data) {
    return res.data.data;
  }
  return res.data;
};

const API_URL = process.env.REACT_APP_SOCKET_URL
  ? `${process.env.REACT_APP_SOCKET_URL}`
  : "http://localhost:3005/api"; // URL backend

// Axios instance với interceptor xử lý refresh token
const api = axios.create({
  baseURL: API_URL,
});

// Lưu token vào localStorage
const setTokens = (token: string, refreshToken: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("refreshToken", refreshToken);
};

// Xóa token khi logout
const clearTokens = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
};

export const loginApi = async (login: string, password: string) => {
  const res = await api.post("/login", { login, password });
  const { token, refreshToken } = res.data.data;
  setTokens(token, refreshToken);
  return res.data;
};

// Logout
// Logout API
export const logoutApi = async () => {
  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");

  if (!token || !refreshToken) {
    console.warn("Không có token hoặc refreshToken để logout");
    // Vẫn xóa localStorage để đảm bảo user thực sự bị đăng xuất
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("Type_login");
    return { success: false, message: "Token không tồn tại" };
  }

  try {
    const res = await api.post(
      "/logout",
      { refreshToken },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Xóa token sau khi logout thành công
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("Type_login");

    return res.data;
  } catch (error) {
    console.error("Logout error:", error);
    // Vẫn xóa token để đảm bảo user không bị kẹt trạng thái đăng nhập
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("Type_login");
  }
};

// Lấy thông tin user từ Keycloak theo id
export const getKeycloakUser = async (userId: string) => {
  const token = localStorage.getItem("token");
  if (!token)
    throw new Error("Không có token để lấy thông tin user từ Keycloak");
  const res = await api.get(`/user/keycloak/id/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.data && res.data.success && res.data.data) {
    return res.data.data;
  }
  return res.data;
};

// Refresh token
export const refreshTokenApi = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("Không có refresh token");

  const res = await api.post("/refresh-token", { refreshToken });
  const { token: newToken } = res.data.data;
  localStorage.setItem("token", newToken);
  return newToken;
};

// Axios interceptor để tự động refresh token khi gặp 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshTokenApi();
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        // refresh token fail → logout
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }
    if (error.response?.status === 503) {
      // Lưu ý: maintenance.html phải nằm trong public/
      window.location.href = "/maintenance.html";
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Gửi request kèm token (Authorization header)
export const apiWithAuth = (token?: string) => {
  const t = token || localStorage.getItem("token");
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${t}`,
    },
  });
};

// Lấy thông tin bản thân (đã xác thực)
export const getMe = async () => {
  const apiAuth = apiWithAuth();
  const res = await apiAuth.get("/user/me");
  return res.data; // { success, data: { _id, username, email, roles } }
};
