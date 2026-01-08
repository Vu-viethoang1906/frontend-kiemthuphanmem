import {
  exportReport,
  downloadExportFile,
  listExportFiles,
  deleteExportFile,
} from '../../../api/exportApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const sampleParams = {
  report_type: 'dashboard' as const,
  format: 'excel' as const,
  board_id: 'board-1',
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  granularity: 'week' as const,
};

const sampleReportResponse = {
  success: true,
  message: 'ok',
  data: {
    filename: 'report.xlsx',
    downloadUrl: 'https://example.com/report.xlsx',
    reportType: 'dashboard',
    format: 'excel',
    expiresAt: '2024-02-01T00:00:00Z',
  },
};

describe('exportApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exportReport calls GET with params and returns data', async () => {
    mockAxios.get.mockResolvedValue({ data: sampleReportResponse });

    const result = await exportReport(sampleParams);

    expect(mockAxios.get).toHaveBeenCalledWith('/export/export', { params: sampleParams });
    expect(result).toEqual(sampleReportResponse);
  });

  it('downloadExportFile requests blob by filename', async () => {
    const blobData = new Blob(['test']);
    mockAxios.get.mockResolvedValue({ data: blobData });

    const result = await downloadExportFile('report.xlsx');

    expect(mockAxios.get).toHaveBeenCalledWith('/exports/report.xlsx', { responseType: 'blob' });
    expect(result).toBe(blobData);
  });

  it('listExportFiles fetches list of exports', async () => {
    const listResponse = { success: true, data: [{ filename: 'f1', format: 'pdf', reportType: 'dashboard', expiresAt: '2024-02-01' }] };
    mockAxios.get.mockResolvedValue({ data: listResponse });

    const result = await listExportFiles();

    expect(mockAxios.get).toHaveBeenCalledWith('/export/exports/list');
    expect(result).toEqual(listResponse);
  });

  it('deleteExportFile deletes export by filename', async () => {
    const deleteResponse = { success: true, message: 'deleted' };
    mockAxios.delete.mockResolvedValue({ data: deleteResponse });

    const result = await deleteExportFile('old.xlsx');

    expect(mockAxios.delete).toHaveBeenCalledWith('/export/exports/old.xlsx');
    expect(result).toEqual(deleteResponse);
  });
});
