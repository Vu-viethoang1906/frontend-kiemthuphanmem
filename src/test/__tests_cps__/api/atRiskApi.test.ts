import {
  detectAtRiskTasks,
  getAtRiskTasksByBoard,
  getAtRiskTasksByUser,
  markTaskAsResolved,
} from '../../../api/atRiskApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const sampleResponse = {
  success: true,
  data: [
    {
      task_id: { _id: 't1', title: 'At risk task' },
      board_id: { _id: 'b1', title: 'Board 1' },
      risk_score: 0.8,
      risk_reasons: [
        { rule_name: 'stuck_in_column', score: 5, details: { column_id: 'c1', days_in_column: 3 } },
      ],
      recommendations: ['Move task forward'],
      detected_at: '2024-01-01T00:00:00Z',
      is_resolved: false,
    },
  ],
};

describe('atRiskApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectAtRiskTasks', () => {
    it('posts without board param when none provided', async () => {
      mockAxios.post.mockResolvedValue({ data: sampleResponse });

      const result = await detectAtRiskTasks();

      expect(mockAxios.post).toHaveBeenCalledWith('/at-risk/detect', {}, { params: undefined });
      expect(result).toEqual(sampleResponse);
    });

    it('posts with board param when provided', async () => {
      mockAxios.post.mockResolvedValue({ data: sampleResponse });

      await detectAtRiskTasks('board-123');

      expect(mockAxios.post).toHaveBeenCalledWith('/at-risk/detect', {}, { params: { board_id: 'board-123' } });
    });
  });

  describe('getAtRiskTasksByBoard', () => {
    it('fetches tasks by board id', async () => {
      mockAxios.get.mockResolvedValue({ data: sampleResponse });

      const result = await getAtRiskTasksByBoard('board-321');

      expect(mockAxios.get).toHaveBeenCalledWith('/at-risk/board/board-321');
      expect(result).toEqual(sampleResponse);
    });
  });

  describe('getAtRiskTasksByUser', () => {
    it('fetches tasks for current user when no id passed', async () => {
      mockAxios.get.mockResolvedValue({ data: sampleResponse });

      const result = await getAtRiskTasksByUser();

      expect(mockAxios.get).toHaveBeenCalledWith('/at-risk/user');
      expect(result).toEqual(sampleResponse);
    });

    it('fetches tasks for specific user', async () => {
      mockAxios.get.mockResolvedValue({ data: sampleResponse });

      await getAtRiskTasksByUser('user-999');

      expect(mockAxios.get).toHaveBeenCalledWith('/at-risk/user/user-999');
    });
  });

  describe('markTaskAsResolved', () => {
    it('marks task as resolved', async () => {
      const mockResult = { success: true, message: 'resolved' };
      mockAxios.put.mockResolvedValue({ data: mockResult });

      const result = await markTaskAsResolved('task-123');

      expect(mockAxios.put).toHaveBeenCalledWith('/at-risk/resolve/task-123');
      expect(result).toEqual(mockResult);
    });
  });
});
