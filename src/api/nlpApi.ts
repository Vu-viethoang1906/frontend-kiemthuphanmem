import axiosInstance from "./axiosInstance";

export interface NLPSearchResponse {
  status: string;
  tasks: Array<{
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    column_id: string;
    swimlane_id?: string;
    assigned_to?: {
      username: string;
      full_name?: string;
      _id?: string;
    };
    priority?: string;
    due_date?: string;
    tags?: any[];
    [key: string]: any;
  }>;
}

/**
 * Search tasks using natural language query
 * @param query - Natural language query (e.g., "tasks của tôi còn 3 ngày nữa hết hạn")
 * @param boardId - Optional board ID to filter tasks by current board
 * @returns List of matching tasks
 */
export const searchTasksByNLP = async (query: string, boardId?: string): Promise<NLPSearchResponse> => {
  const res = await axiosInstance.post<NLPSearchResponse>("/nlp/parse", { query, board_id: boardId });
  return res.data;
};

export interface CommentSummaryResponse {
  status: string;
  data: {
    success: boolean;
    taskTitle?: string;
    taskId?: string;
    summary?: string;
    keyPoints?: string[];
    decisions?: string[];
    actionItems?: string[];
    unresolvedIssues?: string[];
    participants?: string[];
    totalComments?: number;
    message?: string;
    error?: string;
  };
}

/**
 * Tóm tắt comments của một task bằng AI
 * @param taskId - ID của task cần tóm tắt comments
 * @returns Tóm tắt với các điểm chính, quyết định, hành động, vấn đề
 */
export const summarizeComments = async (taskId: string): Promise<CommentSummaryResponse> => {
  const res = await axiosInstance.post<CommentSummaryResponse>("/nlp/summarize", { taskId });
  return res.data;
};

