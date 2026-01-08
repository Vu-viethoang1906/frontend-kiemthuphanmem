import axiosInstance from "./axiosInstance";
// lấy role theo role ID
export const fetchRoleById = async (roleId: string) => {
  const res = await axiosInstance.get(`/role/${roleId}`);
  return res.data;
};

// Lấy toàn bộ permission
export const fetchAllPermissions = async () => {
  const res = await axiosInstance.get("/permission/");
  return res.data;
};

// Lấy permission theo ID
export const fetchPermissionById = async (permissionId: string) => {
  const res = await axiosInstance.get(`/permission/${permissionId}`);
  return res.data;
};

// Tạo permission mới
export const createPermission = async (data: {
  description: string;
  code: string;
  typePermission: string;
}) => {
  const res = await axiosInstance.post("/permission/", data);
  return res.data;
};

// Cập nhật permission
export const updatePermission = async (permissionId: string, data: {
  description?: string;
  code?: string;
  typePermission?: string;
}) => {
  const res = await axiosInstance.put(`/permission/${permissionId}`, data);
  return res.data;
};

// Xóa permission
export const deletePermission = async (permissionId: string) => {
  const res = await axiosInstance.delete(`/permission/${permissionId}`);
  return res.data;
};

// Lấy permission theo role ID
export const fetchPermissionsByRole = async (roleId: string) => {
  const res = await axiosInstance.get(`RolePermission/role/${roleId}`);
  return res.data;
};

// Giả sử token lưu trong localStorage hoặc context
const token = localStorage.getItem("accessToken");

export const updateRolePermissions = async (roleId: string, permissionIds: string[]) => {
  const res = await axiosInstance.put(
    `/RolePermission/updatePermisson`,
    {
      idRole: roleId,
      permissions: permissionIds,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`, // 🔹 gửi token
      },
    }
  );
  return res.data;
};