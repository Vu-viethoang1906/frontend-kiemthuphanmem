import axiosInstance from '../../../api/axiosInstance';
import {
  getAllUserPoints,
  getUserPointsByUser,
  getUserPointByUserAndCenter,
  createUserPoint,
  updateUserPoint,
  deleteUserPoint,
} from '../../../api/userPointApi';

jest.mock('../../../api/axiosInstance');

describe('userPointApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllUserPoints', () => {
    it('should fetch all user points', async () => {
      const mockResponse = { data: [{ _id: 'up1', user_id: 'user1', points: 100 }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await getAllUserPoints();

      expect(mockAxios.get).toHaveBeenCalledWith('/userPoints');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getUserPointsByUser', () => {
    it('should fetch user points by user ID', async () => {
      const userId = 'user1';
      const mockResponse = { data: [{ _id: 'up1', user_id: userId, points: 100 }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await getUserPointsByUser(userId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/userPoints/user/${userId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getUserPointByUserAndCenter', () => {
    it('should fetch user point by user and center ID', async () => {
      const userId = 'user1';
      const centerId = 'center1';
      const mockResponse = { data: { _id: 'up1', user_id: userId, center_id: centerId, points: 100 } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await getUserPointByUserAndCenter(userId, centerId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/userPoints/user/${userId}/center/${centerId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createUserPoint', () => {
    it('should create user point', async () => {
      const data = { user_id: 'user1', center_id: 'center1', points: 100, level: 1, status: 'active' as const };
      const mockResponse = { data: { _id: 'up1', ...data } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createUserPoint(data);

      expect(mockAxios.post).toHaveBeenCalledWith('/userPoints', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateUserPoint', () => {
    it('should update user point', async () => {
      const id = 'up1';
      const data = { points: 200, level: 2 };
      const mockResponse = { data: { _id: id, ...data } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateUserPoint(id, data);

      expect(mockAxios.put).toHaveBeenCalledWith(`/userPoints/${id}`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteUserPoint', () => {
    it('should delete user point', async () => {
      const id = 'up1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteUserPoint(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/userPoints/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

