import axiosInstance from "./axiosInstance";

// Lấy tất cả user-role relationships
export const fetchAllUserRoles = async () => {
  const res = await axiosInstance.get("/userRole/all");
  return res.data;
};

// Lấy role theo user ID
export const fetchRoleByUser = async (userId: string) => {
  const res = await axiosInstance.get(`/userRole/user/${userId}`);
  return res.data;
};

// Tạo user-role mới
export const createUserRole = async (userRoleData: any) => {
  const res = await axiosInstance.post("/userRole", userRoleData);
  return res.data;
};

// Cập nhật user-role
export const updateUserRole = async (id: string, userRoleData: any) => {
  const res = await axiosInstance.put(`/userRole/${id}`, userRoleData);
  return res.data;
};

// Xóa user-role theo ID
export const deleteUserRole = async (id: string) => {
  const res = await axiosInstance.delete(`/userRole/${id}`);
  return res.data;
};

// Xóa tất cả role của user
export const deleteUserRolesByUser = async (userId: string) => {
  const res = await axiosInstance.delete(`/userRole/user/${userId}`);
  return res.data;
};




