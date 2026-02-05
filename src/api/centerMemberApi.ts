import axiosInstance from "./axiosInstance";

// Interface cho CenterMember
export interface CenterMember {
  _id: string;
  center_id: string;
  user_id: string;
  role_in_center?: string;
  createdAt?: string;
  updatedAt?: string;
  // For flattened data from backend
  username?: string;
  user_name?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  member_id?: string;
  // Populated fields
  user?: {
    _id: string;
    username?: string;
    user_name?: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  center?: {
    _id: string;
    name: string;
  };
}

export interface AddCenterMemberData {
  center_id: string;
  user_id: string;
  role_in_center?: string;
}

// Lấy tất cả members của center
export const getCenterMembers = async (centerId: string) => {
  try {
    // Try both possible endpoints
    let response;
    try {
      response = await axiosInstance.get(`/centerMember/${centerId}/members`);
    } catch (err) {
      // If that fails, try the alternative endpoint
      response = await axiosInstance.get(`/centerMember/center/${centerId}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error in getCenterMembers:", error);
    throw error;
  }
};

// Lấy tất cả centers của user
export const getUserCenters = async (userId: string) => {
  const response = await axiosInstance.get(`/centerMember/user/${userId}`);
  return response.data;
};

// Lấy centers của user hiện tại (authenticated)
export const getMyCenters = async () => {
  const response = await axiosInstance.get("/CenterMember/my-centers");
  return response.data;
};

// Thêm member vào center
export const addCenterMember = async (data: AddCenterMemberData) => {
  const endpoints = [
    () => axiosInstance.post("/centerMember", data),
    () => axiosInstance.post("/CenterMember", data),
  ];
  for (const post of endpoints) {
    try {
      const response = await post();
      return response.data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) continue;
      throw err;
    }
  }
  // Fallback: POST /centerMember/:centerId/members
  const { center_id, user_id, role_in_center } = data;
  const res = await axiosInstance.post(
    `/centerMember/${center_id}/members`,
    { user_id, role_in_center: role_in_center || "Member" }
  );
  return res.data;
};

// Xóa member khỏi center (theo centerId + userId - tự tìm member_id)
export const removeCenterMember = async (centerId: string, userId: string) => {
  try {
    const membersResponse = await axiosInstance.get(
      `/centerMember/${centerId}/members`
    );
    const members = membersResponse.data?.data || membersResponse.data || [];

    const memberRecord = members.find((m: any) => {
      const memberUserId = m.user_id?._id || m.user_id?.id || m._id || m.user_id;
      return (
        memberUserId === userId ||
        memberUserId?.toString() === userId?.toString()
      );
    });

    if (!memberRecord) {
      throw new Error("Không tìm thấy thành viên trong center này");
    }

    const memberId = (memberRecord as any).member_id || memberRecord._id;
    if (!memberId) {
      throw new Error("Không tìm thấy ID của centerMember record");
    }

    const response = await axiosInstance.delete(`/centerMember/${memberId}`);
    return response.data;
  } catch (error: any) {
    if (
      error.response?.status === 404 ||
      error.message?.includes("Không tìm thấy")
    ) {
      return { success: true, message: "User không có trong center này" };
    }
    throw error;
  }
};

// Xóa member khỏi center theo member_id (record ID) - dùng khi đã có member_id từ danh sách
export const removeCenterMemberByMemberId = async (memberId: string) => {
  const response = await axiosInstance.delete(`/centerMember/${memberId}`);
  return response.data;
};

// Cập nhật role của member trong center
export const updateCenterMemberRole = async (
  centerId: string,
  userId: string,
  role: string
) => {
  const response = await axiosInstance.put(
    `/centerMember/${centerId}/${userId}`,
    {
      role_in_center: role,
    }
  );
  return response.data;
};
