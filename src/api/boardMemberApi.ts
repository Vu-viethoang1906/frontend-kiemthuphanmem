import axiosInstance from "./axiosInstance";

// Get all board members (admin only)
export const fetchAllBoardMembers = async () => {
  const res = await axiosInstance.get("/boardMember/all");
  return res.data;
};

// Get members of a specific board
export const fetchBoardMembers = async (boardId: string) => {
  const res = await axiosInstance.get(`/boardMember/board/${boardId}`);
  return res.data;
};

// Add member to board
export const addBoardMember = async (boardId: string, data: { user_id: string; role?: string }) => {
  const res = await axiosInstance.post(`/boardMember/board/${boardId}`, data);
  return res.data;
};

// Update member role in board
export const updateBoardMemberRole = async (boardId: string, userId: string, data: { role: string }) => {
  const res = await axiosInstance.put(`/boardMember/board/${boardId}/user/${userId}`, data);
  return res.data;
};

// Remove member from board
export const removeBoardMember = async (boardId: string, userId: string) => {
  const res = await axiosInstance.delete(`/boardMember/board/${boardId}/user/${userId}`);
  return res.data;
};

// Get boards by user
export const fetchBoardsByUser = async (userId: string) => {
  const res = await axiosInstance.get(`/boardMember/user/${userId}/boards`);
  return res.data;
};
