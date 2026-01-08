import axiosInstance from "./axiosInstance";

// Get all tags
export const fetchAllTags = async () => {
  const res = await axiosInstance.get("/tags");
  return res.data;
};

// Get tag by id
export const fetchTagById = async (id: string) => {
  const res = await axiosInstance.get(`/tags/${id}`);
  return res.data;
};

// Create tag (admin only)
export const createTag = async (data: { name: string; color?: string; description?: string; boardId?: string }) => {
  const res = await axiosInstance.post("/tags", data);
  return res.data;
};

// Update tag (admin only)
export const updateTag = async (id: string, data: { name?: string; color?: string; description?: string }) => {
  const res = await axiosInstance.put(`/tags/${id}`, data);
  return res.data;
};

// Delete tag (admin only)
export const deleteTag = async (id: string) => {
  const res = await axiosInstance.delete(`/tags/${id}`);
  return res.data;
};

// Get tags by task
export const fetchTagsByTask = async (taskId: string) => {
  const res = await axiosInstance.get(`/tags/task/${taskId}`);
  return res.data;
};

// Add tag to task
export const addTagToTask = async (taskId: string, tagId: string) => {
  const res = await axiosInstance.post(`/tags/task/${taskId}/tag/${tagId}`);
  return res.data;
};

// Remove tag from task
export const removeTagFromTask = async (taskId: string, tagId: string) => {
  const res = await axiosInstance.delete(`/tags/task/${taskId}/tag/${tagId}`);
  return res.data;
};

// Get tags by board
export const fetchTagsByBoard = async (boardId: string) => {
  const res = await axiosInstance.get(`/tags/board/${boardId}`);
  return res.data;
};
