import axiosInstance from '../../../api/axiosInstance';
import {
  fetchAllRoles,
  fetchRoleById,
  fetchRoleByName,
  fetchMyRole,
  createRole,
  updateRole,
  deleteRole,
} from '../../../api/roleApi';

jest.mock('../../../api/axiosInstance');

describe('roleApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllRoles', () => {
    it('should fetch all roles', async () => {
      const mockResponse = { data: [{ id: 'role1', name: 'Admin' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllRoles();

      expect(mockAxios.get).toHaveBeenCalledWith('/role');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchRoleById', () => {
    it('should fetch role by ID', async () => {
      const id = 'role1';
      const mockResponse = { data: { id, name: 'Admin' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchRoleById(id);

      expect(mockAxios.get).toHaveBeenCalledWith(`/role/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchRoleByName', () => {
    it('should fetch role by name', async () => {
      const name = 'admin';
      const mockResponse = { data: { id: 'role1', name: 'Admin' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchRoleByName(name);

      expect(mockAxios.get).toHaveBeenCalledWith(`/role/name/${name}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchMyRole', () => {
    it('should fetch my role', async () => {
      const mockResponse = { data: { id: 'role1', name: 'User' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchMyRole();

      expect(mockAxios.get).toHaveBeenCalledWith('/role/my-role');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      const roleData = { name: 'New Role', permissions: ['read', 'write'] };
      const mockResponse = { data: { id: 'role1', ...roleData } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createRole(roleData);

      expect(mockAxios.post).toHaveBeenCalledWith('/role', roleData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateRole', () => {
    it('should update a role', async () => {
      const id = 'role1';
      const roleData = { name: 'Updated Role', permissions: ['read'] };
      const mockResponse = { data: { id, ...roleData } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateRole(id, roleData);

      expect(mockAxios.put).toHaveBeenCalledWith(`/role/${id}`, roleData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role', async () => {
      const id = 'role1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteRole(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/role/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

