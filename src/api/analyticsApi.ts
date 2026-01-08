
import axiosInstance from "./axiosInstance";

// Get line chart data for analytics
export const getLineChartData = async (params: {
  board_id: string;
  start_date: string;
  end_date: string;
  granularity: 'day' | 'week' | 'month';
}) => {
  const res = await axiosInstance.get('/analytics/line-chart', { params });
  return res.data;
};

// Get board performance metrics (dashboard stats)
export const getBoardPerformance = async (boardId: string) => {
  const res = await axiosInstance.get(`/analytics/board-performance/${boardId}`);
  return res.data;
};

// Get completion rate
export const getCompletionRate = async (params: {
  board_id?: string;
  user_id?: string;
  center_id?: string;
  group_id?: string;
}) => {
  const res = await axiosInstance.get('/analytics/completion-rate', { params });
  return res.data;
};

// Get estimation accuracy for a board (and optional filters)
export const getEstimationAccuracy = async (params: {
  board_id: string;
  start_date?: string;
  end_date?: string;
  user_id?: string;
  priority?: 'High' | 'Medium' | 'Low';
}) => {
  const res = await axiosInstance.get('/analytics/estimation-accuracy', { params });
  return res.data;
};

// Get throughput and CFD data
export const getThroughputAndCFD = async (params: {
  boardId: string;
  startDate?: string;
  endDate?: string;
  wipLimit?: number;
}) => {
  const { boardId, startDate, endDate, wipLimit } = params;
  const res = await axiosInstance.post('/analytics/ThroughputAndCFD', {
    idBoard: boardId,
    start_date: startDate,
    end_date: endDate,
    wipLimit,
  });
  return res.data;
};

// Get completion speed (velocity) data
export const getCompletionSpeed = async (params: {
  board_id: string;
  start_date: string;
  end_date: string;
}) => {
  const res = await axiosInstance.get('/analytics/completion-speed', { params });
  return res.data;
};

// Get gamification correlation data
export const getGamificationCorrelation = async (params?: {
  center_id?: string;
  board_id?: string;
}) => {
  const res = await axiosInstance.get('/analytics/gamification-correlation', { params });
  return res.data;
};

// Get cycle time data
export const getCycleTime = async (params: {
  idBoard: string;
}) => {
  const res = await axiosInstance.get('/analytics/cycle-time', { 
    params: { board_id: params.idBoard }
  });
  return res.data;
};

// Get centers performance comparison data
export const compareCentersPerformance = async (params?: {
  board_id?: string;
}) => {
  const res = await axiosInstance.get('/analytics/centers-performance', { params });
  return res.data;
};

// Get leaderboard data
export const getLeaderboard = async (params?: {
  center_id?: string;
  limit?: number;
  start_date?: string;
  end_date?: string;
}) => {
  const res = await axiosInstance.get('/analytics/leaderboard', { params });
  return res.data;
};

// Get board health score
export const getBoardHealthScore = async (board_id: string) => {
  const res = await axiosInstance.get(`/analytics/HealthScore/board/${board_id}`);
  return res.data;
};