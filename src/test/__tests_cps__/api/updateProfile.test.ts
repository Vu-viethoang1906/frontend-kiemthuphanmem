import { updateProfile, changePassword } from '../../../api/updateProfile';
import { apiWithAuth } from '../../../api/authApi';

jest.mock('../../../api/authApi');

const mockApiWithAuth = apiWithAuth as jest.MockedFunction<typeof apiWithAuth>;

describe('updateProfile', () => {
  let mockApi: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi = {
      put: jest.fn(),
    };
    mockApiWithAuth.mockReturnValue(mockApi);
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = {
        full_name: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
      };
      mockApi.put.mockResolvedValue({ data: { success: true, ...updateData } });

      const result = await updateProfile('user-123', updateData);

      expect(mockApiWithAuth).toHaveBeenCalled();
      expect(mockApi.put).toHaveBeenCalledWith('/user/me', updateData);
      expect(result.success).toBe(true);
    });

    it('should update only full name', async () => {
      const updateData = { full_name: 'Jane Smith' };
      mockApi.put.mockResolvedValue({ data: { success: true } });

      await updateProfile('user-456', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/user/me', updateData);
    });

    it('should update only username', async () => {
      const updateData = { username: 'newusername' };
      mockApi.put.mockResolvedValue({ data: { success: true } });

      await updateProfile('user-789', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/user/me', updateData);
    });

    it('should update only email', async () => {
      const updateData = { email: 'newemail@example.com' };
      mockApi.put.mockResolvedValue({ data: { success: true } });

      await updateProfile('user-abc', updateData);

      expect(mockApi.put).toHaveBeenCalledWith('/user/me', updateData);
    });

    it('should handle API errors', async () => {
      mockApi.put.mockRejectedValue(new Error('Update failed'));

      await expect(
        updateProfile('user-123', { full_name: 'Test' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('changePassword', () => {
    it('should change user password', async () => {
      const passwordData = {
        current_password: 'oldpass123',
        new_password: 'newpass456',
      };
      mockApi.put.mockResolvedValue({
        data: { success: true, message: 'Password changed' },
      });

      const result = await changePassword(passwordData);

      expect(mockApiWithAuth).toHaveBeenCalled();
      expect(mockApi.put).toHaveBeenCalledWith('/user/change-password', passwordData);
      expect(result.success).toBe(true);
    });

    it('should handle incorrect current password', async () => {
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpass123',
      };
      const error = new Error('Request failed');
      (error as any).response = { data: { message: 'Current password is incorrect' } };
      mockApi.put.mockRejectedValue(error);

      await expect(changePassword(passwordData)).rejects.toThrow('Request failed');
    });

    it('should handle weak new password', async () => {
      const passwordData = {
        current_password: 'correctpass',
        new_password: 'weak',
      };
      const error = new Error('Validation error');
      (error as any).response = { data: { message: 'Password too weak' } };
      mockApi.put.mockRejectedValue(error);

      await expect(changePassword(passwordData)).rejects.toThrow('Validation error');
    });

    it('should handle network errors', async () => {
      const passwordData = {
        current_password: 'oldpass',
        new_password: 'newpass',
      };
      mockApi.put.mockRejectedValue(new Error('Network error'));

      await expect(changePassword(passwordData)).rejects.toThrow('Network error');
    });
  });
});
