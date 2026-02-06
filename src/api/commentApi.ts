import axiosInstance from "./axiosInstance";

// Create comment
export const createComment = async (data: { 
  task_id: string; 
  content: string; 
  user_id: string;
  collaborations?: string; // ID của comment cha (nếu là reply)
  user_tag_id?: string;
}) => {
  const res = await axiosInstance.post("/comments", data);
  return res.data;
};

// Get comments by task
export const fetchCommentsByTask = async (taskId: string) => {
  const res = await axiosInstance.get(`/comments/task/${taskId}`);
  return res.data;
};

// Get comment by id
export const fetchCommentById = async (id: string) => {
  const res = await axiosInstance.get(`/comments/${id}`);
  return res.data;
};

// Update comment
export const updateComment = async (id: string, data: { content: string }) => {
  const res = await axiosInstance.put(`/comments/${id}`, data);
  return res.data;
};

// Delete comment
export const deleteComment = async (id: string) => {
  const res = await axiosInstance.delete(`/comments/${id}`);
  return res.data;
};

// Get my comments
export const fetchMyComments = async () => {
  const res = await axiosInstance.get("/comments/user/my");
  return res.data;
};

// 🆕 Get board members by task ID for @mention autocomplete
export const fetchBoardMembersByTask = async (taskId: string) => {
  const res = await axiosInstance.get(`/comments/task/${taskId}/members`);
  return res.data;
};
