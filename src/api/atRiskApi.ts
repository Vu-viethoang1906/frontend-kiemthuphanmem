import axiosInstance from "./axiosInstance";

export interface RiskReason {
  rule_name: "unassigned_near_deadline" | "stuck_in_column" | "user_has_many_overdue" | "high_estimate_low_time";
  score: number;
  details: {
    days_until_due?: number;
    due_date?: string;
    days_in_column?: number;
    column_id?: string;
    column_name?: string;
    last_moved_at?: string;
    overdue_count?: number;
    assigned_to?: string;
    estimate_hours?: number;
    hours_remaining?: number;
  };
}

export interface AtRiskTask {
  _id?: string;
  task_id: {
    _id: string;
    title: string;
    due_date?: string;
    assigned_to?: {
      _id: string;
      full_name?: string;
      username?: string;
      email?: string;
    };
    column_id?: {
      _id: string;
      name: string;
      order?: number;
      isDone?: boolean;
    };
    estimate_hours?: number;
  };
  board_id: {
    _id: string;
    title: string;
  };
  risk_score: number;
  risk_reasons: RiskReason[];
  recommendations: string[];
  detected_at: string;
  resolved_at?: string | null;
  is_resolved: boolean;
  notified_users?: Array<{
    user_id: string;
    notified_at: string;
  }>;
}

export interface AtRiskTasksResponse {
  success: boolean;
  message?: string;
  data: AtRiskTask[];
  count?: number;
}

// Detect at-risk tasks (manual trigger)
export const detectAtRiskTasks = async (boardId?: string): Promise<AtRiskTasksResponse> => {
  const res = await axiosInstance.post("/at-risk/detect", {}, {
    params: boardId ? { board_id: boardId } : undefined,
  });
  return res.data;
};

// Get at-risk tasks by board
export const getAtRiskTasksByBoard = async (boardId: string): Promise<AtRiskTasksResponse> => {
  const res = await axiosInstance.get(`/at-risk/board/${boardId}`);
  return res.data;
};

// Get at-risk tasks by user
export const getAtRiskTasksByUser = async (userId?: string): Promise<AtRiskTasksResponse> => {
  const url = userId ? `/at-risk/user/${userId}` : "/at-risk/user";
  const res = await axiosInstance.get(url);
  return res.data;
};

// Mark task as resolved
export const markTaskAsResolved = async (taskId: string): Promise<{ success: boolean; message?: string; data?: any }> => {
  const res = await axiosInstance.put(`/at-risk/resolve/${taskId}`);
  return res.data;
};

