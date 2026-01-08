import axiosInstance from "./axiosInstance";

export async function getTasksByBoard(boardId: string, params = {}) {
  const res = await axiosInstance.get(`/tasks/board/${boardId}`, { params });
  return res.data;
}

export async function getTasksByUser(userId: string, params = {}) {
  const res = await axiosInstance.get(`/tasks/user/${userId}`, { params });
  return res.data;
}

export default {
  getTasksByBoard,
  getTasksByUser,
};
