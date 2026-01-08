import axiosInstance from './axiosInstance';

export interface ScheduledReport {
  _id: string;
  user_id: string;
  board_id: string | {
    _id: string;
    title: string;
  };
  report_type: 'dashboard' | 'velocity' | 'leaderboard' | 'center_comparison';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string;
  retry_count: number;
  last_error: string | null;
  report_params?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledReportData {
  board_id: string;
  report_type: 'dashboard' | 'velocity' | 'leaderboard' | 'center_comparison';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  report_params?: Record<string, any>;
}

export interface UpdateScheduledReportData {
  board_id?: string;
  report_type?: 'dashboard' | 'velocity' | 'leaderboard' | 'center_comparison';
  frequency?: 'daily' | 'weekly' | 'monthly';
  recipients?: string[];
  is_active?: boolean;
  report_params?: Record<string, any>;
}

export interface ScheduledReportResponse {
  success: boolean;
  message?: string;
  data: ScheduledReport | ScheduledReport[];
}

/**
 * Get all scheduled reports for current user
 */
export const getScheduledReports = async (): Promise<ScheduledReportResponse> => {
  const response = await axiosInstance.get('/scheduled-reports');
  return response.data;
};

/**
 * Get scheduled report by ID
 */
export const getScheduledReportById = async (id: string): Promise<ScheduledReportResponse> => {
  const response = await axiosInstance.get(`/scheduled-reports/${id}`);
  return response.data;
};

/**
 * Create a new scheduled report
 */
export const createScheduledReport = async (
  data: CreateScheduledReportData
): Promise<ScheduledReportResponse> => {
  const response = await axiosInstance.post('/scheduled-reports', data);
  return response.data;
};

/**
 * Update scheduled report
 */
export const updateScheduledReport = async (
  id: string,
  data: UpdateScheduledReportData
): Promise<ScheduledReportResponse> => {
  const response = await axiosInstance.put(`/scheduled-reports/${id}`, data);
  return response.data;
};

/**
 * Delete scheduled report
 */
export const deleteScheduledReport = async (id: string): Promise<ScheduledReportResponse> => {
  const response = await axiosInstance.delete(`/scheduled-reports/${id}`);
  return response.data;
};

/**
 * Send scheduled report immediately (for testing)
 */
export const sendScheduledReportNow = async (id: string): Promise<ScheduledReportResponse> => {
  const response = await axiosInstance.post(`/scheduled-reports/${id}/send`);
  return response.data;
};

/**
 * Process all due scheduled reports (admin only)
 */
export const processScheduledReports = async (): Promise<ScheduledReportResponse> => {
  const response = await axiosInstance.post('/scheduled-reports/process');
  return response.data;
};

