import axiosInstance from "./axiosInstance";

// Get columns by board
export const fetchColumnsByBoard = async (boardId: string) => {
  const res = await axiosInstance.get(`/column/board/${boardId}`);
  return res.data;
};