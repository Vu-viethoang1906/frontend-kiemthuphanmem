import axiosInstance from '../../../api/axiosInstance';
import {
  fetchAllUsers,
  searchUsers,
  findUsers,
  fetchUserById,
  fetchUserByEmail,
  fetchUserByName,
  fetchUserByPhone,
  createUser,
  updateUser,
  deleteUser,
  fetchDeletedUsers,
  restoreUser,
  createKeycloakUser,
} from '../../../api/userApi';

jest.mock('../../../api/axiosInstance');

describe('userApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllUsers', () => {
    it('should fetch all users with default params', async () => {
      const mockResponse = { data: [{ id: 'user1', username: 'user1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllUsers();

      expect(mockAxios.get).toHaveBeenCalledWith('/user/selectAll?page=1&limit=10');
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch all users with custom params', async () => {
      const mockResponse = { data: [{ id: 'user1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllUsers(2, 20);

      expect(mockAxios.get).toHaveBeenCalledWith('/user/selectAll?page=2&limit=20');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('searchUsers', () => {
    it('should search users', async () => {
      const q = 'test';
      const mockResponse = { data: [{ id: 'user1', username: 'testuser' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await searchUsers(q);

      expect(mockAxios.get).toHaveBeenCalledWith('/user/search', {
        params: { q, page: 1, limit: 10 },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('findUsers', () => {
    it('should find users by info', async () => {
      const infor = 'john';
      const mockResponse = { data: [{ id: 'user1', username: 'john' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await findUsers(infor);

      expect(mockAxios.get).toHaveBeenCalledWith('/user/findUsers', {
        params: { infor },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchUserById', () => {
    it('should fetch user by ID', async () => {
      const id = 'user1';
      const mockResponse = { data: { id, username: 'user1' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchUserById(id);

      expect(mockAxios.get).toHaveBeenCalledWith(`/user/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchUserByEmail', () => {
    it('should fetch user by email', async () => {
      const email = 'user@example.com';
      const mockResponse = { data: { id: 'user1', email } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchUserByEmail(email);

      expect(mockAxios.get).toHaveBeenCalledWith(`/user/email/${email}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchUserByName', () => {
    it('should fetch user by name', async () => {
      const name = 'John Doe';
      const mockResponse = { data: { id: 'user1', full_name: name } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchUserByName(name);

      expect(mockAxios.get).toHaveBeenCalledWith(`/user/name/${name}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchUserByPhone', () => {
    it('should fetch user by phone', async () => {
      const numberphone = '0123456789';
      const mockResponse = { data: { id: 'user1', phone: numberphone } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchUserByPhone(numberphone);

      expect(mockAxios.get).toHaveBeenCalledWith(`/user/phone/${numberphone}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const userData = { username: 'newuser', email: 'new@example.com' };
      const mockResponse = { data: { id: 'user1', ...userData } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createUser(userData);

      expect(mockAxios.post).toHaveBeenCalledWith('/user', userData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      const id = 'user1';
      const userData = { username: 'updateduser' };
      const mockResponse = { data: { id, ...userData } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateUser(id, userData);

      expect(mockAxios.put).toHaveBeenCalledWith(`/user/${id}`, userData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const id = 'user1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteUser(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/user/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchDeletedUsers', () => {
    it('should fetch deleted users', async () => {
      const mockResponse = { data: [{ id: 'user1', deleted: true }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchDeletedUsers();

      expect(mockAxios.get).toHaveBeenCalledWith('/user/admin/deleted?type=user&page=1&limit=10');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('restoreUser', () => {
    it('should restore a user', async () => {
      const id = 'user1';
      const mockResponse = { data: { id, deleted: false } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await restoreUser(id);

      expect(mockAxios.put).toHaveBeenCalledWith(`/user/restore/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createKeycloakUser', () => {
    it('should create keycloak user', async () => {
      const payload = { username: 'kcuser', password: 'pass123' };
      const mockResponse = { data: { id: 'user1', username: 'kcuser' } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createKeycloakUser(payload);

      expect(mockAxios.post).toHaveBeenCalledWith('/user/keycloak/createUserPass', payload);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

