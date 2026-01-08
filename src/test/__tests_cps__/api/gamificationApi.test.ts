import axiosInstance from '../../../api/axiosInstance';
import {
  getGamificationConfig,
  enableGamification,
  disableGamification,
  toggleGamification,
  updateGamificationPoints,
} from '../../../api/gamificationApi';

jest.mock('../../../api/axiosInstance');

describe('gamificationApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGamificationConfig', () => {
    it('should fetch gamification config', async () => {
      const mockData = {
        success: true,
        data: {
          is_enabled: true,
          points_per_task: 10,
          points_deduction: 5,
        },
      };
      mockAxios.get.mockResolvedValue({ data: mockData });

      const result = await getGamificationConfig();

      expect(mockAxios.get).toHaveBeenCalledWith('/gamification');
      expect(result).toEqual(mockData);
    });
  });

  describe('enableGamification', () => {
    it('should enable gamification', async () => {
      const mockData = {
        success: true,
        message: 'Gamification enabled',
        data: {
          is_enabled: true,
          points_per_task: 10,
          points_deduction: 5,
        },
      };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await enableGamification();

      expect(mockAxios.post).toHaveBeenCalledWith('/gamification/enable');
      expect(result).toEqual(mockData);
    });
  });

  describe('disableGamification', () => {
    it('should disable gamification', async () => {
      const mockData = {
        success: true,
        message: 'Gamification disabled',
        data: {
          is_enabled: false,
          points_per_task: 10,
          points_deduction: 5,
        },
      };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await disableGamification();

      expect(mockAxios.post).toHaveBeenCalledWith('/gamification/disable');
      expect(result).toEqual(mockData);
    });
  });

  describe('toggleGamification', () => {
    it('should toggle gamification', async () => {
      const mockData = {
        success: true,
        message: 'Gamification toggled',
        data: {
          is_enabled: true,
          points_per_task: 10,
          points_deduction: 5,
        },
      };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await toggleGamification();

      expect(mockAxios.post).toHaveBeenCalledWith('/gamification/toggle');
      expect(result).toEqual(mockData);
    });
  });

  describe('updateGamificationPoints', () => {
    it('should update gamification points', async () => {
      const updateData = {
        points_per_task: 20,
        points_deduction: 10,
      };
      const mockData = {
        success: true,
        message: 'Points updated',
        data: {
          is_enabled: true,
          points_per_task: 20,
          points_deduction: 10,
        },
      };
      mockAxios.put.mockResolvedValue({ data: mockData });

      const result = await updateGamificationPoints(updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/gamification/points', updateData);
      expect(result).toEqual(mockData);
    });
  });
});

