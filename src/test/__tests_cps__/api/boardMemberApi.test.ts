import axiosInstance from '../../../api/axiosInstance';
import {
  fetchAllBoardMembers,
  fetchBoardMembers,
  addBoardMember,
  updateBoardMemberRole,
  removeBoardMember,
  fetchBoardsByUser,
} from '../../../api/boardMemberApi';

jest.mock('../../../api/axiosInstance');

describe('boardMemberApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllBoardMembers', () => {
    it('should fetch all board members', async () => {
      const mockResponse = { data: [{ id: 'member1', user_id: 'user1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllBoardMembers();

      expect(mockAxios.get).toHaveBeenCalledWith('/boardMember/all');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchBoardMembers', () => {
    it('should fetch board members by board ID', async () => {
      const boardId = 'board1';
      const mockResponse = { data: [{ id: 'member1', board_id: boardId }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchBoardMembers(boardId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/boardMember/board/${boardId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('addBoardMember', () => {
    it('should add member to board', async () => {
      const boardId = 'board1';
      const data = { user_id: 'user1', role: 'member' };
      const mockResponse = { data: { id: 'member1', board_id: boardId, ...data } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await addBoardMember(boardId, data);

      expect(mockAxios.post).toHaveBeenCalledWith(`/boardMember/board/${boardId}`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateBoardMemberRole', () => {
    it('should update board member role', async () => {
      const boardId = 'board1';
      const userId = 'user1';
      const data = { role: 'admin' };
      const mockResponse = { data: { id: 'member1', role: 'admin' } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateBoardMemberRole(boardId, userId, data);

      expect(mockAxios.put).toHaveBeenCalledWith(`/boardMember/board/${boardId}/user/${userId}`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('removeBoardMember', () => {
    it('should remove member from board', async () => {
      const boardId = 'board1';
      const userId = 'user1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await removeBoardMember(boardId, userId);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/boardMember/board/${boardId}/user/${userId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchBoardsByUser', () => {
    it('should fetch boards by user ID', async () => {
      const userId = 'user1';
      const mockResponse = { data: [{ id: 'board1', title: 'Board 1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchBoardsByUser(userId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/boardMember/user/${userId}/boards`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

