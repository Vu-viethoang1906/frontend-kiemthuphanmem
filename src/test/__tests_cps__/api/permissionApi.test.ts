import { 
  fetchRoleById,
  fetchAllPermissions, 
  fetchPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  fetchPermissionsByRole
} from '../../../api/permissionApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('permissionApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRoleById', () => {
    it('should fetch role by id', async () => {
      const mockRole = { id: 'role-123', name: 'Admin', permissions: [] };
      mockAxios.get.mockResolvedValue({ data: mockRole });

      const result = await fetchRoleById('role-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/role/role-123');
      expect(result).toEqual(mockRole);
    });
  });

  describe('fetchAllPermissions', () => {
    it('should fetch all permissions', async () => {
      const mockPermissions = [
        { id: 'perm-1', code: 'create_task', description: 'Create tasks' },
        { id: 'perm-2', code: 'delete_task', description: 'Delete tasks' },
      ];
      mockAxios.get.mockResolvedValue({ data: mockPermissions });

      const result = await fetchAllPermissions();

      expect(mockAxios.get).toHaveBeenCalledWith('/permission/');
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('fetchPermissionById', () => {
    it('should fetch permission by id', async () => {
      const mockPermission = { id: 'perm-1', code: 'view_board', description: 'View board' };
      mockAxios.get.mockResolvedValue({ data: mockPermission });

      const result = await fetchPermissionById('perm-1');

      expect(mockAxios.get).toHaveBeenCalledWith('/permission/perm-1');
      expect(result).toEqual(mockPermission);
    });
  });

  describe('createPermission', () => {
    it('should create new permission', async () => {
      const newPermission = {
        description: 'Edit tasks',
        code: 'edit_task',
        typePermission: 'task',
      };
      const mockResponse = { id: 'perm-3', ...newPermission };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await createPermission(newPermission);

      expect(mockAxios.post).toHaveBeenCalledWith('/permission/', newPermission);
      expect(result).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      mockAxios.post.mockRejectedValue(new Error('Permission code already exists'));

      await expect(
        createPermission({ description: 'Test', code: 'duplicate', typePermission: 'test' })
      ).rejects.toThrow('Permission code already exists');
    });
  });

  describe('updatePermission', () => {
    it('should update permission', async () => {
      const updateData = { description: 'Updated description' };
      const mockResponse = { id: 'perm-1', ...updateData };
      mockAxios.put.mockResolvedValue({ data: mockResponse });

      const result = await updatePermission('perm-1', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/permission/perm-1', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should update multiple fields', async () => {
      const updateData = {
        description: 'New description',
        code: 'new_code',
        typePermission: 'board',
      };
      mockAxios.put.mockResolvedValue({ data: updateData });

      await updatePermission('perm-2', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/permission/perm-2', updateData);
    });
  });

  describe('deletePermission', () => {
    it('should delete permission', async () => {
      const mockResponse = { success: true, message: 'Permission deleted' };
      mockAxios.delete.mockResolvedValue({ data: mockResponse });

      const result = await deletePermission('perm-456');

      expect(mockAxios.delete).toHaveBeenCalledWith('/permission/perm-456');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('fetchPermissionsByRole', () => {
    it('should fetch permissions for specific role', async () => {
      const mockRolePermissions = [
        { id: 'perm-1', code: 'view_board' },
        { id: 'perm-2', code: 'edit_task' },
      ];
      mockAxios.get.mockResolvedValue({ data: mockRolePermissions });

      const result = await fetchPermissionsByRole('role-123');

      expect(mockAxios.get).toHaveBeenCalledWith('RolePermission/role/role-123');
      expect(result).toEqual(mockRolePermissions);
    });

    it('should handle empty permissions', async () => {
      mockAxios.get.mockResolvedValue({ data: [] });

      const result = await fetchPermissionsByRole('role-with-no-perms');

      expect(result).toEqual([]);
    });
  });
});
