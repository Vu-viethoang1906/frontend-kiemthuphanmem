import axiosInstance from './axiosInstance';

export interface ExportReportParams {
  report_type: 'dashboard' | 'velocity' | 'leaderboard' | 'center_comparison';
  format: 'excel' | 'pdf';
  board_id?: string;
  center_id?: string;
  start_date?: string;
  end_date?: string;
  granularity?: 'day' | 'week' | 'month';
  wipLimit?: number;
  limit?: number;
}

export interface ExportReportResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    downloadUrl: string;
    reportType: string;
    format: string;
    expiresAt: string;
  };
}

export const exportReport = async (params: ExportReportParams): Promise<ExportReportResponse> => {
  const response = await axiosInstance.get('/export/export', { params });
  return response.data;
};

export const downloadExportFile = async (filename: string): Promise<Blob> => {
  const response = await axiosInstance.get(`/exports/${filename}`, {
    responseType: 'blob',
  });
  return response.data;
};

export interface ExportedFileItem {
  filename: string;
  format: 'excel' | 'pdf' | string;
  reportType: string;
  expiresAt: string;
}

export const listExportFiles = async (): Promise<{ success: boolean; data: ExportedFileItem[] }> => {
  const response = await axiosInstance.get('/export/exports/list');
  return response.data;
};

export const deleteExportFile = async (filename: string): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.delete(`/export/exports/${filename}`);
  return response.data;
};

