import { fetchAvatarUser, updateAvatar } from '../../../api/avataApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('avataApi', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('fetchAvatarUser', () => {
    it('should fetch avatar and return full URL with base URL from env', async () => {
      process.env.REACT_APP_SOCKET_URL = 'https://example.com';
      mockAxios.get.mockResolvedValue({
        data: { avatar_url: '/uploads/avatar123.jpg' },
      });

      const result = await fetchAvatarUser('user-123');

      expect(mockAxios.get).toHaveBeenCalledWith('img/users/user-123/avatar');
      expect(result.avatar_url).toBe('https://example.com/uploads/avatar123.jpg');
    });

    it('should use default localhost when env variable not set', async () => {
      delete process.env.REACT_APP_SOCKET_URL;
      mockAxios.get.mockResolvedValue({
        data: { avatar_url: '/uploads/avatar.jpg' },
      });

      const result = await fetchAvatarUser('user-456');

      expect(result.avatar_url).toBe('http://localhost:3005/uploads/avatar.jpg');
    });

    it('should handle API errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('User not found'));

      await expect(fetchAvatarUser('invalid-user')).rejects.toThrow('User not found');
    });
  });

  describe('updateAvatar', () => {
    it('should upload avatar file with correct format', async () => {
      const file = new File(['avatar-content'], 'avatar.jpg', { type: 'image/jpeg' });
      const mockResponse = { success: true, avatar_url: '/uploads/new-avatar.jpg' };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await updateAvatar('user-789', file);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'img/users/user-789/avatar',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle upload errors', async () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });
      mockAxios.post.mockRejectedValue(new Error('File too large'));

      await expect(updateAvatar('user-123', file)).rejects.toThrow('File too large');
    });
  });
});
