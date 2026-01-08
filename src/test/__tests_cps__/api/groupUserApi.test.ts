import axiosInstance from '../../../api/axiosInstance';
import { getGroupsByUser } from '../../../api/groupUserApi';

jest.mock('../../../api/axiosInstance');

describe('groupUserApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGroupsByUser', () => {
    it('should fetch groups by user ID', async () => {
      const userId = 'user123';
      const mockData = {
        success: true,
        data: [
          { id: 'group1', name: 'Group 1' },
          { id: 'group2', name: 'Group 2' },
        ],
      };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await getGroupsByUser(userId);

      expect(mockAxios.post).toHaveBeenCalledWith('/groupMember/getGroupUser', {
        id_user: userId,
      });
      expect(result).toEqual(mockData);
    });

    it('should handle empty user ID', async () => {
      const userId = '';
      const mockData = { success: true, data: [] };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await getGroupsByUser(userId);

      expect(mockAxios.post).toHaveBeenCalledWith('/groupMember/getGroupUser', {
        id_user: userId,
      });
      expect(result).toEqual(mockData);
    });
  });
});

