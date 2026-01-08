import { fetchActivityLogs, fetchLogsByUser, fetchTaskActivityLogs } from '../../../api/historyTaskApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('historyTaskApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchActivityLogs', () => {
    it('should fetch all activity logs', async () => {
      const mockLogs = [
        { id: 'log-1', action: 'created', timestamp: '2024-01-01T10:00:00Z' },
        { id: 'log-2', action: 'updated', timestamp: '2024-01-02T11:00:00Z' },
      ];
      mockAxios.get.mockResolvedValue({ data: mockLogs });

      const result = await fetchActivityLogs('user-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/activityLogs/');
      expect(result).toEqual(mockLogs);
    });

    it('should handle API errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('Failed to fetch logs'));

      await expect(fetchActivityLogs('user-123')).rejects.toThrow('Failed to fetch logs');
    });
  });

  describe('fetchLogsByUser', () => {
    it('should fetch logs for specific user', async () => {
      const mockUserLogs = [
        { id: 'log-1', userId: 'user-456', action: 'assigned' },
        { id: 'log-2', userId: 'user-456', action: 'completed' },
      ];
      mockAxios.get.mockResolvedValue({ data: mockUserLogs });

      const result = await fetchLogsByUser('user-456');

      expect(mockAxios.get).toHaveBeenCalledWith('/activityLogs/user/user-456');
      expect(result).toEqual(mockUserLogs);
    });

    it('should handle empty logs', async () => {
      mockAxios.get.mockResolvedValue({ data: [] });

      const result = await fetchLogsByUser('user-with-no-logs');

      expect(result).toEqual([]);
    });
  });

  describe('fetchTaskActivityLogs', () => {
    it('should fetch task activity logs by board with no params', async () => {
      const mockTaskLogs = [
        { taskId: 'task-1', changes: [] },
        { taskId: 'task-2', changes: [] },
      ];
      mockAxios.get.mockResolvedValue({ data: mockTaskLogs });

      const result = await fetchTaskActivityLogs('board-789');

      expect(mockAxios.get).toHaveBeenCalledWith('historyTask/board/board-789/history', {
        params: undefined,
      });
      expect(result).toEqual(mockTaskLogs);
    });

    it('should fetch task activity logs with changed_by filter', async () => {
      const mockFilteredLogs = [{ taskId: 'task-1', changedBy: 'user-123' }];
      mockAxios.get.mockResolvedValue({ data: mockFilteredLogs });

      const params = { changed_by: 'user-123' };
      await fetchTaskActivityLogs('board-789', params);

      expect(mockAxios.get).toHaveBeenCalledWith('historyTask/board/board-789/history', {
        params,
      });
    });

    it('should fetch task activity logs with task_id filter', async () => {
      const mockTaskSpecificLogs = [{ taskId: 'task-specific', changes: [] }];
      mockAxios.get.mockResolvedValue({ data: mockTaskSpecificLogs });

      const params = { task_id: 'task-specific' };
      await fetchTaskActivityLogs('board-789', params);

      expect(mockAxios.get).toHaveBeenCalledWith('historyTask/board/board-789/history', {
        params,
      });
    });

    it('should handle combined filters', async () => {
      mockAxios.get.mockResolvedValue({ data: [] });

      const params = { changed_by: 'user-123', task_id: 'task-456' };
      await fetchTaskActivityLogs('board-789', params);

      expect(mockAxios.get).toHaveBeenCalledWith('historyTask/board/board-789/history', {
        params,
      });
    });
  });
});
