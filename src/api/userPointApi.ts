import axiosInstance from "./axiosInstance";

// Interface cho UserPoint - Match 100% với Backend
export interface UserPoint {
  _id: string;
  user_id: string;
  center_id: string;
  points: number;           // Điểm hiện tại
  total_points: number;     // Tổng điểm tích lũy
  level: number;            // Cấp độ (1, 2, 3...)
  status: 'active' | 'inactive' | 'suspended';
  createdAt?: string;
  updatedAt?: string;
  // Populated fields
  user?: {
    _id: string;
    username: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  center?: {
    _id: string;
    name: string;
  };
}

export interface CreateUserPointData {
  user_id: string;
  center_id: string;
  points?: number;
  total_points?: number;
  level?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateUserPointData {
  points?: number;
  total_points?: number;
  level?: number;
  status?: 'active' | 'inactive' | 'suspended';
}

// Lấy tất cả user points
export const getAllUserPoints = async () => {
  const response = await axiosInstance.get("/userPoints");
  return response.data;
};

// Lấy user points theo user
export const getUserPointsByUser = async (userId: string) => {
  const response = await axiosInstance.get(`/userPoints/user/${userId}`);
  return response.data;
};

// Lấy user point theo user và center
export const getUserPointByUserAndCenter = async (userId: string, centerId: string) => {
  const response = await axiosInstance.get(`/userPoints/user/${userId}/center/${centerId}`);
  return response.data;
};

// Tạo user point mới
export const createUserPoint = async (data: CreateUserPointData) => {
  const response = await axiosInstance.post("/userPoints", data);
  return response.data;
};

// Cập nhật user point
export const updateUserPoint = async (id: string, data: UpdateUserPointData) => {
  const response = await axiosInstance.put(`/userPoints/${id}`, data);
  return response.data;
};

// Xóa user point
export const deleteUserPoint = async (id: string) => {
  const response = await axiosInstance.delete(`/userPoints/${id}`);
  return response.data;
};
