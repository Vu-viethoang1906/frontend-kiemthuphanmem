import axiosInstance from "./axiosInstance";

// Interface cho Center
export interface Center {
  _id: string;
  name: string;
  address?: string;
  description?: string;
  status: 'active' | 'inactive' | 'maintenance';
  phone?: string;
  email?: string;
  memberCount?: number;
  groupCount?: number;
  createdAt?: string;
  updatedAt?: string;
  deleted_at?: Date | null;
}

export interface CreateCenterData {
  name: string;
  address?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  phone?: string;
  email?: string;
}

export interface UpdateCenterData {
  name?: string;
  address?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance';
  phone?: string;
  email?: string;
}

// Lấy tất cả centers
export const getAllCenters = async () => {
  const response = await axiosInstance.get("/centers");
  return response.data;
};

// Lấy center theo ID
export const getCenterById = async (id: string) => {
  const response = await axiosInstance.get(`/centers/${id}`);
  return response.data;
};

// Tạo center mới (Admin only)
export const createCenter = async (data: CreateCenterData) => {
  const response = await axiosInstance.post("/centers", data);
  return response.data;
};

// Cập nhật center (Admin only)
export const updateCenter = async (id: string, data: UpdateCenterData) => {
  const response = await axiosInstance.put(`/centers/${id}`, data);
  return response.data;
};

// Xóa center (Admin only - soft delete)
export const deleteCenter = async (id: string) => {
  const response = await axiosInstance.delete(`/centers/${id}`);
  return response.data;
};
// Lấy các bảng của một thành viên trong center
export const fetchCenterMemberBoards = async (userId: string, centerId: string) => {
  const response = await axiosInstance.post(`/centers/getMemberBoards`, {
    idUser: userId,
    idCenter: centerId,
  });
  return response.data;
};