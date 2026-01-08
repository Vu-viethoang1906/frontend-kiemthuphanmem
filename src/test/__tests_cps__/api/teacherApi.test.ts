import axiosInstance from '../../../api/axiosInstance';
import teacherApiDefault, { getTasksByBoard, getTasksByUser } from '../../../api/teacherApi';

jest.mock('../../../api/axiosInstance');
const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('teacherApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('default export exposes methods', () => {
    expect(teacherApiDefault).toHaveProperty('getTasksByBoard');
    expect(teacherApiDefault).toHaveProperty('getTasksByUser');
  });

  describe('getTasksByBoard', () => {
    it('fetches tasks by board with params', async () => {
      const boardId = 'board-1';
      const params = { status: 'open', limit: 10 } as const;
      const data = [{ id: 't1' }, { id: 't2' }];
      mockAxios.get.mockResolvedValueOnce({ data });

      const result = await getTasksByBoard(boardId, params);

      expect(mockAxios.get).toHaveBeenCalledWith(`/tasks/board/${boardId}`, { params });
      expect(result).toEqual(data);
    });

    it('returns empty array when no tasks', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: [] });
      const result = await getTasksByBoard('x');
      expect(result).toEqual([]);
    });

    it('propagates errors from axios', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('network down'));
      await expect(getTasksByBoard('b')).rejects.toThrow('network down');
    });
  });

  describe('getTasksByUser', () => {
    it('fetches tasks by user with params', async () => {
      const userId = 'user-1';
      const params = { page: 2 } as const;
      const data = [{ id: 'u1' }];
      mockAxios.get.mockResolvedValueOnce({ data });

      const result = await getTasksByUser(userId, params);

      expect(mockAxios.get).toHaveBeenCalledWith(`/tasks/user/${userId}`, { params });
      expect(result).toEqual(data);
    });

    it('handles empty result', async () => {
      mockAxios.get.mockResolvedValueOnce({ data: [] });
      const result = await getTasksByUser('u');
      expect(result).toEqual([]);
    });

    it('propagates errors from axios', async () => {
      mockAxios.get.mockRejectedValueOnce(new Error('bad gateway'));
      await expect(getTasksByUser('u2')).rejects.toThrow('bad gateway');
    });
  });
});
