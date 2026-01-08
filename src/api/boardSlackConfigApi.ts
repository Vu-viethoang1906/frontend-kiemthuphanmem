import axiosInstance from "./axiosInstance";

export interface BoardSlackConfig {
  _id?: string;
  board_id: string;
  webhook_url?: string;
  notify_task_created: boolean;
  notify_task_assigned: boolean;
  notify_task_completed: boolean;
  notify_comment_added: boolean;
  is_active: boolean;
  channel_name?: string;
  notes?: string;
  configured_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardSlackConfigResponse {
  success: boolean;
  data: BoardSlackConfig;
  message?: string;
}


export const getBoardSlackConfig = async (boardId: string): Promise<BoardSlackConfig> => {
  const res = await axiosInstance.get<BoardSlackConfigResponse>(`/boards/slack/${boardId}/config`);
  return res.data.data;
};

export const updateBoardSlackConfig = async (
  boardId: string,
  data: {
    webhook_url?: string;
    notify_task_created?: boolean;
    notify_task_assigned?: boolean;
    notify_task_completed?: boolean;
    notify_comment_added?: boolean;
    is_active?: boolean;
    channel_name?: string;
    notes?: string;
  }
): Promise<BoardSlackConfig> => {
  const res = await axiosInstance.put<BoardSlackConfigResponse>(
    `/boards/slack/${boardId}/config`,
    data
  );
  return res.data.data;
};


export const toggleBoardSlackNotifications = async (
  boardId: string,
  isActive: boolean
): Promise<{ is_active: boolean }> => {
  const res = await axiosInstance.put<{
    success: boolean;
    data: { is_active: boolean };
    message?: string;
  }>(`/boards/slack/${boardId}/config/toggle`, {
    is_active: isActive,
  });
  return res.data.data;
};


export const testBoardSlackWebhook = async (
  boardId: string,
  webhookUrl: string
): Promise<{ success: boolean; message: string }> => {
  const res = await axiosInstance.post<{
    success: boolean;
    message: string;
  }>(`/boards/slack/${boardId}/config/test`, {
    webhook_url: webhookUrl,
  });
  return res.data;
};


export const deleteBoardSlackConfig = async (boardId: string): Promise<void> => {
  await axiosInstance.delete<{ success: boolean; message: string }>(
    `/boards/slack/${boardId}/config`
  );
};

