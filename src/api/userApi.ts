
import axiosInstance from "./axiosInstance";


// Lấy toàn bộ user (chỉ admin)
// userApi.ts
export const fetchAllUsers = async (page = 1, limit = 10) => {
  const res = await axiosInstance.get(`/user/selectAll?page=${page}&limit=${limit}`);
  return res.data;
};

// Tìm kiếm users theo keyword
export const searchUsers = async (q: string, page = 1, limit = 10) => {
  const res = await axiosInstance.get(`/user/search`, {
    params: { 
      q: q, 
      page: page, 
      limit: limit 
    }
  });
  return res.data;
};

// Gợi ý users theo 'infor' (name/email gần đúng)
export const findUsers = async (infor: string) => {
  const res = await axiosInstance.get(`/user/findUsers`, {
    params: { infor },
  });
  return res.data;
};

// Lấy user theo ID
export const fetchUserById = async (id: string) => {
  const res = await axiosInstance.get(`/user/${id}`);
  return res.data;
};

// Lấy user theo email
export const fetchUserByEmail = async (email: string) => {
  const res = await axiosInstance.get(`/user/email/${email}`);
  return res.data;
};

// Lấy user theo tên
export const fetchUserByName = async (name: string) => {
  const res = await axiosInstance.get(`/user/name/${name}`);
  return res.data;
};

// Lấy user theo số điện thoại
export const fetchUserByPhone = async (numberphone: string) => {
  const res = await axiosInstance.get(`/user/phone/${numberphone}`);
  return res.data;
};

// Tạo mới user
export const createUser = async (userData: any) => {

  const res = await axiosInstance.post("/user", userData);
  return res.data;
};

// Cập nhật user
export const updateUser = async (id: string, userData: any) => {
  const res = await axiosInstance.put(`/user/${id}`, userData);
  return res.data;
};

// Xóa user (soft delete)
export const deleteUser = async (id: string) => {
  const res = await axiosInstance.delete(`/user/${id}`);
  return res.data;
};

// Lấy danh sách users đã bị xóa mềm
export const fetchDeletedUsers = async (page = 1, limit = 10) => {
  const res = await axiosInstance.get(`/user/admin/deleted?type=user&page=${page}&limit=${limit}`);
  return res.data;
};

// Khôi phục user đã bị xóa mềm
export const restoreUser = async (id: string) => {
  const res = await axiosInstance.put(`/user/restore/${id}`);
  return res.data;
};

export const createKeycloakUser = async (payload: any) => {
  const res = await axiosInstance.post("/user/keycloak/createUserPass", payload);
  return res.data;
};
// thay đổi mật khẩu user
