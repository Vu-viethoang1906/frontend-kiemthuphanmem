import axiosInstance from "./axiosInstance";

export interface TaskQualityMetric {
  task_id: string;
  title: string;
  column_name: string;
  assigned_to: {
    id: string;
    username: string;
    full_name?: string;
  } | null;
  commentCount: number;
  attachmentCount: number;
  churnCount: number;
  collaborationScore: number;
}

export interface LowQualityTask {
  task_id: string;
  title: string;
  column_name: string;
  assigned_to: {
    id: string;
    username: string;
    full_name?: string;
  } | null;
  commentCount: number;
  attachmentCount: number;
  collaborationScore: number;
  warning: string;
}

export interface HighChurnTask {
  task_id: string;
  title: string;
  column_name: string;
  assigned_to: {
    id: string;
    username: string;
    full_name?: string;
  } | null;
  churnCount: number;
  commentCount: number;
  collaborationScore: number;
  warning: string;
}

export interface TaskQualityMetricsData {
  board: {
    id: string;
    title: string;
  };
  summary: {
    totalTasks: number;
    averageCommentsPerTask: number;
    averageAttachmentsPerTask: number;
    averageChurnCount: number;
    averageCollaborationScore: number;
    lowQualityTasksCount: number;
    highChurnTasksCount: number;
  };
  lowQualityTasks: LowQualityTask[];
  highChurnTasks: HighChurnTask[];
  tasks: TaskQualityMetric[];
}

/**
 * Get task quality metrics for a board
 */
export const getTaskQualityMetrics = async (boardId: string): Promise<TaskQualityMetricsData> => {
  const res = await axiosInstance.get<{ success: boolean; data: TaskQualityMetricsData }>(
    "/analytics/task-quality-metrics",
    { params: { board_id: boardId } }
  );
  return res.data.data;
};

