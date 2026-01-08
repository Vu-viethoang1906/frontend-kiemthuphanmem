import axiosInstance from "./axiosInstance";

export interface OverdueTask {
  taskId: string;
  title: string;
  dueDate: string;
  priority: string;
  columnId: string | null;
  columnName: string;
  assignedTo: {
    userId: string;
    username: string;
    fullName: string;
    email: string;
  } | null;
  daysOverdue: number;
}

export interface BreakdownByUser {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  violationCount: number;
  avgDaysOverdue: number;
}

export interface BreakdownByPriority {
  total: number;
  avgDaysOverdue: number;
}

export interface BreakdownByColumn {
  columnId: string;
  columnName: string;
  total: number;
  avgDaysOverdue: number;
}

export interface RepeatOffender {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  violationCount: number;
}

export interface OverdueAnalysisData {
  totalOverdueTasks: number;
  overdueTasks: OverdueTask[];
  breakdownByUser: BreakdownByUser[];
  breakdownByPriority: {
    high: BreakdownByPriority;
    medium: BreakdownByPriority;
    low: BreakdownByPriority;
    none: BreakdownByPriority;
  };
  breakdownByColumn: BreakdownByColumn[];
  repeatOffenders: RepeatOffender[];
  averageOverdueDays: number;
}

/**
 * Get overdue analysis for a board
 */
export const getOverdueAnalysis = async (boardId: string): Promise<OverdueAnalysisData> => {
  const res = await axiosInstance.post<{ success: boolean; data: OverdueAnalysisData }>(
    `/analytics/Overdue_Analysis`,
    { board_id: boardId }
  );
  return res.data.data;
};

