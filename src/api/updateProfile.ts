
import { apiWithAuth } from "./authApi";

// Update user profile (cần userId trong URL)
export const updateProfile = async (
  userId: string,
  data: {
    full_name?: string;
    username?: string;
    email?: string;
  }
) => {
  const apiAuth = apiWithAuth();
  const res = await apiAuth.put(`/user/me`, data);
  return res.data;
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => {
  try {
    const apiAuth = apiWithAuth();
    const res = await apiAuth.put(`/user/change-password`, data);
    return res.data;
  } catch (error: any) {
    console.error("❌ Lỗi khi đổi mật khẩu:", error.response?.data || error.message);
    throw error;
  }
};