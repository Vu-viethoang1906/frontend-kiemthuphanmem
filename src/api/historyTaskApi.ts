import axiosInstance from "./axiosInstance";

export interface ActivityLogParams {
  changed_by?: string;
  task_id?: string;
}

export const fetchActivityLogs = async (idUser: String) => {
  const res = await axiosInstance.get(`/activityLogs/`);
  return res.data;
};

export const fetchLogsByUser = async (idUser: String) => {
  const res = await axiosInstance.get(`/activityLogs/user/${idUser}`);
  return res.data;
};

export const fetchTaskActivityLogs = async (
  boardId: string,
  params?: ActivityLogParams
) => {
  // Gọi route: /task/:taskId/history
  ///historyTask/board/69140991c1f17a14db2a9182/history
  const res = await axiosInstance.get(`historyTask/board/${boardId}/history`, {
    params,
  });
  return res.data;
};
