
import axiosInstance from "./axiosInstance";

// Get columns by board
export const fetchColumnsByBoard = async (boardId: string) => {
  const res = await axiosInstance.get(`/column/board/${boardId}`);
  return res.data;
};

// Get column by id
export const fetchColumnById = async (id: string) => {
  const res = await axiosInstance.get(`/column/${id}`);
  return res.data;
};

// Create column - Updated to match backend API
export interface CreateColumnRequest {
  board_id: string;
  name: string;
  wip_limit?: number;
  order?: number;
  isdone?: boolean;
}

export interface ColumnResponse {
  _id: string;
  name: string;
  order: number;
  isDone: boolean;
  board_id: string;
}

export const createColumn = async (data: CreateColumnRequest) => {
  const res = await axiosInstance.post("/column", data);
  return res.data;
};

// Update column
export const updateColumn = async (id: string, data: { name?: string; wip_limit?: number; order?: number }) => {
  const res = await axiosInstance.put(`/column/${id}`, data);
  return res.data;
};

// Delete column
export const deleteColumn = async (id: string) => {
  const res = await axiosInstance.delete(`/column/${id}`);
  return res.data;
};

// Reorder columns
export const reorderColumns = async (boardId: string, data: { column_ids: string[] }) => {
  const res = await axiosInstance.put(`/column/board/${boardId}/reorder`, data);
  return res.data;
};

// Set a column as "Done" column - Updated to match backend API
export const setDoneColumn = async (boardId: string, columnId: string) => {
  const res = await axiosInstance.put(`/column/board/${boardId}/isdoneColumn/${columnId}`);
  return res.data;
};

// Get the "Done" column for a board - Updated to match backend API  
export const getDoneColumn = async (boardId: string) => {
  const res = await axiosInstance.get(`/column/board/${boardId}`);
  // Filter to find column with isDone: true
  const columns = res.data?.data || res.data || [];
  const doneColumn = columns.find((col: any) => col.isDone === true);
  return { data: doneColumn };
};

// Update isDone column (from nhat branch)
export const updataIsDone = async (boardId: string, column_ids: string) => {
  const res = await axiosInstance.put(`/column/board/${boardId}/isdoneColumn/${column_ids}`);
  return res.data;
};
