import {
  fetchMyBoards,
  fetchBoardMember,
  fetchBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  cloneBoardFromTemplate,
  configureBoardSettings,
  toggleBoardSwimlane,
} from '../../../api/boardApi';
import axiosInstance from '../../../api/axiosInstance';
import { boardCache } from '../../../utils/boardCache';

jest.mock('../../../api/axiosInstance');
jest.mock('../../../utils/boardCache');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockBoardCache = boardCache as jest.Mocked<typeof boardCache>;

describe('boardApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchMyBoards', () => {
    it('should fetch boards from API when cache is empty', async () => {
      mockBoardCache.get.mockReturnValue(null);
      const mockBoards = [
        { _id: 'board-1', name: 'Board 1' },
        { _id: 'board-2', name: 'Board 2' },
      ];
      mockAxios.get.mockResolvedValue({
        data: { data: mockBoards, pagination: { page: 1, limit: 10 } },
      });

      const result = await fetchMyBoards({ page: 1, limit: 10 });

      expect(mockAxios.get).toHaveBeenCalledWith('/boards/my', {
        params: { page: 1, limit: 10 },
      });
      expect(result.data).toEqual(mockBoards);
      expect(result.fromCache).toBe(false);
    });

    it('should return cached data when available', async () => {
      const cachedData = [{ _id: 'cached-1', name: 'Cached Board' }];
      mockBoardCache.get.mockReturnValue({
        data: cachedData,
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        timestamp: Date.now(),
        params: '{}',
      });

      const result = await fetchMyBoards();

      expect(mockAxios.get).not.toHaveBeenCalled();
      expect(result.data).toEqual(cachedData);
      expect(result.fromCache).toBe(true);
    });

    it('should support search and filter params', async () => {
      mockBoardCache.get.mockReturnValue(null);
      mockAxios.get.mockResolvedValue({ data: { data: [] } });

      await fetchMyBoards({
        search: 'project',
        is_template: true,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      expect(mockAxios.get).toHaveBeenCalledWith('/boards/my', {
        params: {
          search: 'project',
          is_template: true,
          sortBy: 'name',
          sortOrder: 'asc',
        },
      });
    });
  });

  describe('fetchBoardMember', () => {
    it('should fetch board members with user and group IDs', async () => {
      const mockMembers = [{ userId: 'user-1', role: 'admin' }];
      mockAxios.post.mockResolvedValue({ data: mockMembers });

      const result = await fetchBoardMember('user-123', 'group-456');

      expect(mockAxios.post).toHaveBeenCalledWith('/groups/getBoarMember', {
        idUser: 'user-123',
        idGroup: 'group-456',
      });
      expect(result).toEqual(mockMembers);
    });
  });

  describe('fetchBoardById', () => {
    it('should fetch board by ID', async () => {
      const mockBoard = { _id: 'board-789', name: 'Test Board' };
      mockAxios.get.mockResolvedValue({ data: mockBoard });

      const result = await fetchBoardById('board-789');

      expect(mockAxios.get).toHaveBeenCalledWith('/boards/board-789');
      expect(result).toEqual(mockBoard);
    });
  });

  describe('createBoard', () => {
    it('should create board and invalidate cache', async () => {
      const boardData = { name: 'New Board', description: 'Test' };
      const mockCreated = { _id: 'new-board', ...boardData };
      mockAxios.post.mockResolvedValue({ data: mockCreated });

      const result = await createBoard(boardData);

      expect(mockAxios.post).toHaveBeenCalledWith('/boards', boardData);
      expect(mockBoardCache.invalidate).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });
  });

  describe('updateBoard', () => {
    it('should update board and invalidate cache', async () => {
      const updateData = { name: 'Updated Name' };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateBoard('board-123', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/boards/board-123', updateData);
      expect(mockBoardCache.invalidate).toHaveBeenCalled();
    });
  });

  describe('deleteBoard', () => {
    it('should delete board and invalidate cache', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await deleteBoard('board-456');

      expect(mockAxios.delete).toHaveBeenCalledWith('/boards/board-456');
      expect(mockBoardCache.invalidate).toHaveBeenCalled();
    });
  });

  describe('cloneBoardFromTemplate', () => {
    it('should clone board from template', async () => {
      const cloneData = {
        title: 'Cloned Board',
        description: 'From template',
        userId: 'user-123',
      };
      mockAxios.post.mockResolvedValue({ data: { _id: 'cloned-board' } });

      await cloneBoardFromTemplate('template-789', cloneData);

      expect(mockAxios.post).toHaveBeenCalledWith('/boards/clone/template-789', cloneData);
      expect(mockBoardCache.invalidate).toHaveBeenCalled();
    });
  });

  describe('configureBoardSettings', () => {
    it('should configure board settings', async () => {
      const settings = { settings: { theme: 'dark', notifications: true } };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await configureBoardSettings('board-123', settings);

      expect(mockAxios.put).toHaveBeenCalledWith('/boards/board-123/settings', settings);
    });
  });

  describe('toggleBoardSwimlane', () => {
    it('should toggle swimlane collapse state', async () => {
      mockAxios.put.mockResolvedValue({ data: { collapsed: true } });

      await toggleBoardSwimlane('board-123', 'swimlane-456');

      expect(mockAxios.put).toHaveBeenCalledWith(
        '/boards/board-123/swimlanes/swimlane-456/toggle'
      );
    });
  });
});
