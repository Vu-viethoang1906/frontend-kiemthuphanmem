import axiosInstance from "./axiosInstance";

// 🔹 Lấy tất cả permission
export const fetchAllPermission = async () => {
  try {
    const res = await axiosInstance.get("/permission", {
      headers: { "Cache-Control": "no-cache" },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Lỗi fetchAllPermission:", error);
    return { success: false, data: [] };
  }
};

// 🔹 Lấy tất cả Role-Permission mapping
export const fetchAllRolePermission = async () => {
  try {
    const res = await axiosInstance.get("/RolePermission", {
      headers: { "Cache-Control": "no-cache" },
    });
   
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi fetchAllRolePermission:", error);
    return { success: false, data: [] };
  }
};

// 🔹 Lấy role theo RoleId
export const fetchRoleById = async (roleId: string) => {
  try {
    const res = await axiosInstance.get(`/role/${roleId}`);
    return res.data;
  } catch (error) {
    console.error(`❌ Lỗi fetchRoleById(${roleId}):`, error);
    return null;
  }
};

// 🔹 Cập nhật quyền của role (update permission)
export const updateRolePermissions = async (
  currentUserId: string,
  permissionIds: string[]
) => {
  try {
    const res = await axiosInstance.put(`/RolePermission/RolePermission`, {
      currentUserId,
      permissions: permissionIds,
    });
    return res.data;
  } catch (err: any) {
    console.error("❌ Lỗi updateRolePermissions:", err);
    throw err;
  }
};

// 🔹 Lấy role theo userId
export const getRolebyIdUser = async (userId: string) => {
  try {
    const res = await axiosInstance.get(`/userRole/user/${userId}`);
    return res.data;
  } catch (err: any) {
    console.error("❌ Lỗi getRolebyIdUser:", err);
    throw err;
  }
};

// 🔹 Lấy tất cả user-role mapping
export const fetchAllUserRoles = async () => {
  try {
    const res = await axiosInstance.get("/userRole");
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi fetchAllUserRoles:", error);
    return { success: false, data: [] };
  }
};

// 🔹 Gán role cho user
export const createUserRole = async (payload: {
  user_id: string;
  role_id: string;
}) => {
  try {
    const res = await axiosInstance.post("/userRole", payload);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi createUserRole:", error);
    throw error;
  }
};

// 🔹 Xóa toàn bộ role của 1 user
export const deleteUserRolesByUser = async (userId: string) => {
  try {
    const res = await axiosInstance.delete(`/userRole/user/${userId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi deleteUserRolesByUser:", error);
    throw error;
  }

};
