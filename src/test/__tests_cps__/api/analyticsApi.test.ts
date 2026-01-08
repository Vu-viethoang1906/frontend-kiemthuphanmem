import { getLineChartData, getBoardPerformance, getCompletionRate } from '../../../api/analyticsApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('analyticsApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLineChartData', () => {
    it('should fetch line chart data with correct params', async () => {
      const mockData = {
        labels: ['2024-01-01', '2024-01-02'],
        datasets: [{ data: [10, 20] }],
      };
      mockAxios.get.mockResolvedValue({ data: mockData });

      const params = {
        board_id: 'board-123',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        granularity: 'day' as const,
      };

      const result = await getLineChartData(params);

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/line-chart', { params });
      expect(result).toEqual(mockData);
    });

    it('should handle different granularity options', async () => {
      const mockData = { labels: [], datasets: [] };
      mockAxios.get.mockResolvedValue({ data: mockData });

      const weekParams = {
        board_id: 'board-123',
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        granularity: 'week' as const,
      };

      await getLineChartData(weekParams);

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/line-chart', { params: weekParams });
    });
  });

  describe('getBoardPerformance', () => {
    it('should fetch board performance metrics', async () => {
      const mockPerformance = {
        totalTasks: 50,
        completedTasks: 30,
        avgCompletionTime: 3.5,
        productivity: 85,
      };
      mockAxios.get.mockResolvedValue({ data: mockPerformance });

      const result = await getBoardPerformance('board-456');

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/board-performance/board-456');
      expect(result).toEqual(mockPerformance);
    });

    it('should handle API errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(getBoardPerformance('invalid-board')).rejects.toThrow('Network error');
    });
  });

  describe('getCompletionRate', () => {
    it('should fetch completion rate with board_id', async () => {
      const mockRate = { completionRate: 75.5, trend: 'up' };
      mockAxios.get.mockResolvedValue({ data: mockRate });

      const params = { board_id: 'board-789' };
      const result = await getCompletionRate(params);

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/completion-rate', { params });
      expect(result).toEqual(mockRate);
    });

    it('should fetch completion rate with user_id', async () => {
      const mockRate = { completionRate: 80, trend: 'stable' };
      mockAxios.get.mockResolvedValue({ data: mockRate });

      const params = { user_id: 'user-123' };
      await getCompletionRate(params);

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/completion-rate', { params });
    });

    it('should fetch completion rate with center_id', async () => {
      const mockRate = { completionRate: 65 };
      mockAxios.get.mockResolvedValue({ data: mockRate });

      const params = { center_id: 'center-456' };
      await getCompletionRate(params);

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/completion-rate', { params });
    });

    it('should fetch completion rate with group_id', async () => {
      const mockRate = { completionRate: 90 };
      mockAxios.get.mockResolvedValue({ data: mockRate });

      const params = { group_id: 'group-789' };
      await getCompletionRate(params);

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/completion-rate', { params });
    });

    it('should handle empty params', async () => {
      const mockRate = { completionRate: 70 };
      mockAxios.get.mockResolvedValue({ data: mockRate });

      const result = await getCompletionRate({});

      expect(mockAxios.get).toHaveBeenCalledWith('/analytics/completion-rate', { params: {} });
      expect(result).toEqual(mockRate);
    });
  });
});
