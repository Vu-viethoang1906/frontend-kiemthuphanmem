import { getNotificaton, readAt } from '../../../api/notificationApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('notificationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificaton', () => {
    it('should fetch notifications for a user', async () => {
      const mockNotifications = [
        { id: '1', message: 'Test notification 1', read: false },
        { id: '2', message: 'Test notification 2', read: true },
      ];

      mockedAxios.get.mockResolvedValueOnce({ data: mockNotifications });

      const result = await getNotificaton('user-123');

      expect(mockedAxios.get).toHaveBeenCalledWith('/notification/user-123');
      expect(result).toEqual(mockNotifications);
    });

    it('should handle empty notification list', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [] });

      const result = await getNotificaton('user-456');

      expect(mockedAxios.get).toHaveBeenCalledWith('/notification/user-456');
      expect(result).toEqual([]);
    });

    it('should propagate errors from API', async () => {
      const error = new Error('Network error');
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(getNotificaton('user-789')).rejects.toThrow('Network error');
    });
  });

  describe('readAt', () => {
    it('should mark notification as read', async () => {
      const mockResponse = { success: true, message: 'Notification marked as read' };
      mockedAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await readAt('notification-123');

      expect(mockedAxios.put).toHaveBeenCalledWith('/notification/read/notification-123');
      expect(result).toEqual(mockResponse);
    });

    it('should handle read status update', async () => {
      const mockResponse = { id: 'notification-456', read: true };
      mockedAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await readAt('notification-456');

      expect(mockedAxios.put).toHaveBeenCalledWith('/notification/read/notification-456');
      expect(result).toEqual(mockResponse);
    });

    it('should propagate errors when marking as read', async () => {
      const error = new Error('Failed to update');
      mockedAxios.put.mockRejectedValueOnce(error);

      await expect(readAt('notification-789')).rejects.toThrow('Failed to update');
    });
  });
});
