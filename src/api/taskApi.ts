import axiosInstance from "./axiosInstance";

// Create task
export const createTask = async (data: any) => {
  const res = await axiosInstance.post("/tasks", data);
  return res.data;
};

// Get task by id
export const fetchTaskById = async (id: string) => {
  const res = await axiosInstance.get(`/tasks/${id}`);
  return res.data;
};

// Update task
export const updateTask = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/tasks/${id}`, data);
  return res.data;
};

// Delete task
export const deleteTask = async (id: string) => {
  const res = await axiosInstance.delete(`/tasks/${id}`);
  return res.data;
};

// Get tasks by board
export const fetchTasksByBoard = async (
  boardId: string,
  params?: { limit?: number; page?: number }
) => {
  const res = await axiosInstance.get(`/tasks/board/${boardId}`, {
    params: {
      limit: params?.limit || 1000, // Lấy tất cả tasks, không giới hạn
      page: params?.page || 1,
    },
  });
  return res.data;
};

// Search tasks in board
export const searchTasksInBoard = async (boardId: string, query: string) => {
  const res = await axiosInstance.get(`/tasks/board/${boardId}/search`, {
    params: { query },
  });
  return res.data;
};

// Get task stats by board
export const fetchTaskStatsByBoard = async (boardId: string) => {
  const res = await axiosInstance.get(`/tasks/board/${boardId}/stats`);
  return res.data;
};

// Get task history
export const fetchTaskHistory = async (taskId: string) => {
  const res = await axiosInstance.get(`/tasks/${taskId}/history`);
  return res.data;
};

// Get tasks by column
export const fetchTasksByColumn = async (columnId: string) => {
  const res = await axiosInstance.get(`/tasks/column/${columnId}`);
  return res.data;
};

// Get my assigned tasks
export const fetchMyAssignedTasks = async () => {
  const res = await axiosInstance.get(`/tasks/my/assigned`);
  return res.data;
};

// ⭐ Toggle star/favorite task
export const toggleTaskStar = async (taskId: string) => {
  const res = await axiosInstance.put(`/tasks/${taskId}/toggle-star`);
  return res.data;
};

// ⭐ Get my starred tasks
export const fetchMyStarredTasks = async () => {
  const res = await axiosInstance.get(`/tasks/my/starred`);
  return res.data;
};

// Get tasks by user
export const fetchTasksByUser = async (userId: string) => {
  const res = await axiosInstance.get(`/tasks/user/${userId}`);
  return res.data;
};

// Move task (drag & drop)

// Update task dates
export const updateTaskDates = async (
  id: string,
  data: { start_date?: string; end_date?: string; due_date?: string }
) => {
  const res = await axiosInstance.put(`/tasks/${id}/dates`, data);
  return res.data;
};

// Update task estimate
export const updateTaskEstimate = async (
  id: string,
  data: { estimated_hours?: number; estimated_points?: number }
) => {
  const res = await axiosInstance.put(`/tasks/${id}/estimate`, data);
  return res.data;
};
// kéo thả
export const moveTaskApi = (
  taskId: string,
  data: {
    new_column_id: string;
    new_swimlane_id?: string | null;
    prev_task_id?: string | null;
    next_task_id?: string | null;
  }
) => {
  return axiosInstance.put(`/tasks/${taskId}/move`, data);
};

export const moveColumnApi = (boardId: string, columnIds: string[]) => {
  return axiosInstance.put(`/column/${boardId}/move`, {
    ids: columnIds, // 👈 Gửi đúng cấu trúc mà BE xử lý
  });
};

export const moveSwimlaneApi = (boardId: string, swimlaneIds: string[]) => {
  return axiosInstance.put(`/swimlanes/board/${boardId}/reorder`, {
    ids: swimlaneIds, // 👈 Gửi đúng cấu trúc mà BE xử lý
  });
};

export const dataLineChart = (boardId: string) => {
  return axiosInstance.post(`/tasks/board/${boardId}/lineChart`);
};
