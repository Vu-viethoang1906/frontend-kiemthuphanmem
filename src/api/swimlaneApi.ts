import axiosInstance from "./axiosInstance";

// Get swimlanes by board
export const fetchSwimlanesByBoard = async (boardId: string) => {
  const res = await axiosInstance.get(`/swimlanes/board/${boardId}`);
  return res.data;
};

// Get swimlane by id
export const fetchSwimlaneById = async (id: string) => {
  const res = await axiosInstance.get(`/swimlanes/${id}`);
  return res.data;
};

// Create swimlane
export const createSwimlane = async (data: { board_id: string; name: string; order?: number }) => {
  const res = await axiosInstance.post("/swimlanes", data);
  return res.data;
};

// Update swimlane
export const updateSwimlane = async (id: string, data: { name?: string; order?: number }) => {
  const res = await axiosInstance.put(`/swimlanes/${id}`, data);
  return res.data;
};

// Delete swimlane
export const deleteSwimlane = async (id: string) => {
  const res = await axiosInstance.delete(`/swimlanes/${id}`);
  return res.data;
};

// Toggle collapse swimlane
export const toggleCollapseSwimlane = async (id: string) => {
  const res = await axiosInstance.put(`/swimlanes/${id}/toggle-collapse`);
  return res.data;
};

// Reorder swimlanes
export const reorderSwimlanes = async (boardId: string, data: { swimlane_ids: string[] }) => {
  const res = await axiosInstance.put(`/swimlanes/board/${boardId}/reorder`, data);
  return res.data;
};

