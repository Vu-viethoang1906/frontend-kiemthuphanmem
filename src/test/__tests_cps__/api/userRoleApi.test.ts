import axiosInstance from '../../../api/axiosInstance';
import {
  fetchAllUserRoles,
  fetchRoleByUser,
  createUserRole,
  updateUserRole,
  deleteUserRole,
  deleteUserRolesByUser,
} from '../../../api/userRoleApi';

jest.mock('../../../api/axiosInstance');

describe('userRoleApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllUserRoles', () => {
    it('should fetch all user roles', async () => {
      const mockResponse = { data: [{ id: 'ur1', user_id: 'user1', role_id: 'role1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllUserRoles();

      expect(mockAxios.get).toHaveBeenCalledWith('/userRole/all');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchRoleByUser', () => {
    it('should fetch role by user ID', async () => {
      const userId = 'user1';
      const mockResponse = { data: [{ id: 'ur1', user_id: userId, role_id: 'role1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchRoleByUser(userId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/userRole/user/${userId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createUserRole', () => {
    it('should create user role', async () => {
      const userRoleData = { user_id: 'user1', role_id: 'role1' };
      const mockResponse = { data: { id: 'ur1', ...userRoleData } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createUserRole(userRoleData);

      expect(mockAxios.post).toHaveBeenCalledWith('/userRole', userRoleData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role', async () => {
      const id = 'ur1';
      const userRoleData = { role_id: 'role2' };
      const mockResponse = { data: { id, ...userRoleData } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateUserRole(id, userRoleData);

      expect(mockAxios.put).toHaveBeenCalledWith(`/userRole/${id}`, userRoleData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteUserRole', () => {
    it('should delete user role by ID', async () => {
      const id = 'ur1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteUserRole(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/userRole/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteUserRolesByUser', () => {
    it('should delete all roles by user ID', async () => {
      const userId = 'user1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteUserRolesByUser(userId);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/userRole/user/${userId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

