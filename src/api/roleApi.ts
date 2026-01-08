import axiosInstance from "./axiosInstance";

// Lấy tất cả roles
export const fetchAllRoles = async () => {
  const res = await axiosInstance.get("/role");
  return res.data;
};

// Lấy role theo ID
export const fetchRoleById = async (id: string) => {
  const res = await axiosInstance.get(`/role/${id}`);
  return res.data;
};

// Lấy role theo tên
export const fetchRoleByName = async (name: string) => {
  const res = await axiosInstance.get(`/role/name/${name}`);
  return res.data;
};

// Lấy role của user hiện tại
export const fetchMyRole = async () => {
  const res = await axiosInstance.get("/role/my-role");
  return res.data;
};

// Tạo role mới
export const createRole = async (roleData: any) => {
  const res = await axiosInstance.post("/role", roleData);
  return res.data;
};

// Cập nhật role
export const updateRole = async (id: string, roleData: any) => {
  const res = await axiosInstance.put(`/role/${id}`, roleData);
  return res.data;
};

// Xóa role
export const deleteRole = async (id: string) => {
  const res = await axiosInstance.delete(`/role/${id}`);
  return res.data;
};




