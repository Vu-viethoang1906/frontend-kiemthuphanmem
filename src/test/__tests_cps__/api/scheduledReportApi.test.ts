import {
  getScheduledReports,
  getScheduledReportById,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  sendScheduledReportNow,
  processScheduledReports,
} from '../../../api/scheduledReportApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const sampleReport = {
  _id: 'sr1',
  user_id: 'u1',
  board_id: 'b1',
  report_type: 'dashboard' as const,
  frequency: 'daily' as const,
  recipients: ['a@example.com'],
  is_active: true,
  last_sent_at: null,
  next_send_at: '2024-01-02T00:00:00Z',
  retry_count: 0,
  last_error: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const sampleResponse = { success: true, data: sampleReport };

describe('scheduledReportApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets scheduled reports', async () => {
    mockAxios.get.mockResolvedValue({ data: sampleResponse });

    const result = await getScheduledReports();

    expect(mockAxios.get).toHaveBeenCalledWith('/scheduled-reports');
    expect(result).toEqual(sampleResponse);
  });

  it('gets a scheduled report by id', async () => {
    mockAxios.get.mockResolvedValue({ data: sampleResponse });

    const result = await getScheduledReportById('sr1');

    expect(mockAxios.get).toHaveBeenCalledWith('/scheduled-reports/sr1');
    expect(result).toEqual(sampleResponse);
  });

  it('creates a scheduled report', async () => {
    mockAxios.post.mockResolvedValue({ data: sampleResponse });
    const payload = {
      board_id: 'b1',
      report_type: 'dashboard' as const,
      frequency: 'weekly' as const,
      recipients: ['b@example.com'],
    };

    const result = await createScheduledReport(payload);

    expect(mockAxios.post).toHaveBeenCalledWith('/scheduled-reports', payload);
    expect(result).toEqual(sampleResponse);
  });

  it('updates a scheduled report', async () => {
    mockAxios.put.mockResolvedValue({ data: sampleResponse });

    const result = await updateScheduledReport('sr1', { is_active: false });

    expect(mockAxios.put).toHaveBeenCalledWith('/scheduled-reports/sr1', { is_active: false });
    expect(result).toEqual(sampleResponse);
  });

  it('deletes a scheduled report', async () => {
    mockAxios.delete.mockResolvedValue({ data: sampleResponse });

    const result = await deleteScheduledReport('sr1');

    expect(mockAxios.delete).toHaveBeenCalledWith('/scheduled-reports/sr1');
    expect(result).toEqual(sampleResponse);
  });

  it('sends a scheduled report immediately', async () => {
    mockAxios.post.mockResolvedValue({ data: sampleResponse });

    const result = await sendScheduledReportNow('sr1');

    expect(mockAxios.post).toHaveBeenCalledWith('/scheduled-reports/sr1/send');
    expect(result).toEqual(sampleResponse);
  });

  it('processes scheduled reports', async () => {
    mockAxios.post.mockResolvedValue({ data: sampleResponse });

    const result = await processScheduledReports();

    expect(mockAxios.post).toHaveBeenCalledWith('/scheduled-reports/process');
    expect(result).toEqual(sampleResponse);
  });
});
