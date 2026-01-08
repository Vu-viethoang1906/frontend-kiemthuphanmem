import { renderHook, waitFor } from '@testing-library/react';
import { usePermissions } from '../../../hooks/usePermissions';
import * as rolePermissionApi from '../../../api/role&permission';

jest.mock('../../../api/role&permission');

const mockGetRolebyIdUser = rolePermissionApi.getRolebyIdUser as jest.MockedFunction<typeof rolePermissionApi.getRolebyIdUser>;
const mockFetchAllRolePermission = rolePermissionApi.fetchAllRolePermission as jest.MockedFunction<typeof rolePermissionApi.fetchAllRolePermission>;

describe('usePermissions', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should return wildcard permission for admin user', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', JSON.stringify(['admin']));

    const { result } = renderHook(() => usePermissions());

    // Admin check is synchronous, so loading might already be false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual(['*']);
    expect(result.current.hasPermission('any_permission')).toBe(true);
    expect(result.current.hasAnyPermission(['perm1', 'perm2'])).toBe(true);
    expect(result.current.hasAllPermissions(['perm1', 'perm2'])).toBe(true);
  });

  it('should return wildcard permission for System_Manager', async () => {
    localStorage.setItem('userId', 'user456');
    localStorage.setItem('roles', '["System_Manager"]');

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual(['*']);
    expect(result.current.hasPermission('manage_users')).toBe(true);
  });

  it('should handle comma-separated roles string', async () => {
    localStorage.setItem('userId', 'user789');
    localStorage.setItem('roles', 'admin,user');

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual(['*']);
  });

  it('should return empty permissions when no userId', async () => {
    localStorage.setItem('roles', '["user"]');

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual([]);
    expect(result.current.hasPermission('some_perm')).toBe(false);
  });

  it('should handle API error when fetching user roles', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');
    mockGetRolebyIdUser.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual([]);
  });

  it('should handle empty user roles from API', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');
    mockGetRolebyIdUser.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual([]);
  });

  it('should handle invalid JSON in roles localStorage', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', 'invalid-json');

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should not be treated as admin since JSON parse failed
    expect(mockGetRolebyIdUser).toHaveBeenCalledWith('user123');
  });

  it('should load user permissions from roles and permissions', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');

    const mockRoles = [{ _id: 'role1' }, { _id: 'role2' }];
    const mockRolePermissions = [
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm1', code: 'read_tasks' } },
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm2', code: 'create_tasks' } },
      { role_id: { _id: 'role2' }, permission_id: { _id: 'perm3', code: 'delete_tasks' } },
      { role_id: { _id: 'role3' }, permission_id: { _id: 'perm4', code: 'admin_panel' } }, // Different role
    ];

    mockGetRolebyIdUser.mockResolvedValue({ data: mockRoles });
    mockFetchAllRolePermission.mockResolvedValue({ data: mockRolePermissions });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toContain('read_tasks');
    expect(result.current.permissions).toContain('create_tasks');
    expect(result.current.permissions).toContain('delete_tasks');
    expect(result.current.permissions).not.toContain('admin_panel');
    expect(result.current.permissions.length).toBe(3);
  });

  it('should filter out null role_id and permission_id entries', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');

    const mockRoles = [{ _id: 'role1' }];
    const mockRolePermissions = [
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm1', code: 'valid_perm' } },
      { role_id: null, permission_id: { _id: 'perm2', code: 'invalid_perm1' } },
      { role_id: { _id: 'role1' }, permission_id: null },
    ];

    mockGetRolebyIdUser.mockResolvedValue({ data: mockRoles });
    mockFetchAllRolePermission.mockResolvedValue({ data: mockRolePermissions });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual(['valid_perm']);
  });

  it('should handle string role_id and permission_id', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');

    const mockRoles = [{ _id: 'role1' }];
    const mockRolePermissions = [
      { role_id: 'role1', permission_id: 'perm1' }, // String IDs without code
    ];

    mockGetRolebyIdUser.mockResolvedValue({ data: mockRoles });
    mockFetchAllRolePermission.mockResolvedValue({ data: mockRolePermissions });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual([]);
  });

  it('hasPermission should return true for valid permission', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');

    const mockRoles = [{ _id: 'role1' }];
    const mockRolePermissions = [
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm1', code: 'read_tasks' } },
    ];

    mockGetRolebyIdUser.mockResolvedValue({ data: mockRoles });
    mockFetchAllRolePermission.mockResolvedValue({ data: mockRolePermissions });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasPermission('read_tasks')).toBe(true);
    expect(result.current.hasPermission('invalid_perm')).toBe(false);
  });

  it('hasAnyPermission should return true if user has at least one permission', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');

    const mockRoles = [{ _id: 'role1' }];
    const mockRolePermissions = [
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm1', code: 'read_tasks' } },
    ];

    mockGetRolebyIdUser.mockResolvedValue({ data: mockRoles });
    mockFetchAllRolePermission.mockResolvedValue({ data: mockRolePermissions });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasAnyPermission(['read_tasks', 'write_tasks'])).toBe(true);
    expect(result.current.hasAnyPermission(['write_tasks', 'delete_tasks'])).toBe(false);
  });

  it('hasAllPermissions should return true only if user has all permissions', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');

    const mockRoles = [{ _id: 'role1' }];
    const mockRolePermissions = [
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm1', code: 'read_tasks' } },
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm2', code: 'write_tasks' } },
    ];

    mockGetRolebyIdUser.mockResolvedValue({ data: mockRoles });
    mockFetchAllRolePermission.mockResolvedValue({ data: mockRolePermissions });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasAllPermissions(['read_tasks', 'write_tasks'])).toBe(true);
    expect(result.current.hasAllPermissions(['read_tasks', 'delete_tasks'])).toBe(false);
  });

  it('should handle general error during permission loading', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');

    mockGetRolebyIdUser.mockResolvedValue({ data: [{ _id: 'role1' }] });
    mockFetchAllRolePermission.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual([]);
  });

  it('should deduplicate permission codes', async () => {
    localStorage.setItem('userId', 'user123');
    localStorage.setItem('roles', '["user"]');

    const mockRoles = [{ _id: 'role1' }];
    const mockRolePermissions = [
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm1', code: 'read_tasks' } },
      { role_id: { _id: 'role1' }, permission_id: { _id: 'perm2', code: 'read_tasks' } }, // Duplicate
    ];

    mockGetRolebyIdUser.mockResolvedValue({ data: mockRoles });
    mockFetchAllRolePermission.mockResolvedValue({ data: mockRolePermissions });

    const { result } = renderHook(() => usePermissions());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.permissions).toEqual(['read_tasks']);
    expect(result.current.permissions.length).toBe(1);
  });
});
