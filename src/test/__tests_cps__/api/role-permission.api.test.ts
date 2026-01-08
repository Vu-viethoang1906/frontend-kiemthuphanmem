import '@testing-library/jest-dom';

// Mock axiosInstance with function handles created inside the factory
jest.mock('../../../api/axiosInstance', () => {
  const mockGet = jest.fn();
  const mockPost = jest.fn();
  const mockPut = jest.fn();
  const mockDelete = jest.fn();
  return {
    __esModule: true,
    default: { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete },
  };
});

describe('role&permission api combined module', () => {
  beforeEach(() => {
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.get.mockReset();
    mocked.post.mockReset();
    mocked.put.mockReset();
    mocked.delete.mockReset();
  });

  test('fetchAllPermission: success and error fallback', async () => {
    const mod = await import('../../../api/role&permission');
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.get.mockResolvedValueOnce({ data: { ok: true } });
    await expect(mod.fetchAllPermission()).resolves.toEqual({ ok: true });

    mocked.get.mockRejectedValueOnce(new Error('boom'));
    await expect(mod.fetchAllPermission()).resolves.toEqual({ success: false, data: [] });
  });

  test('fetchAllRolePermission: success and error fallback', async () => {
    const mod = await import('../../../api/role&permission');
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.get.mockResolvedValueOnce({ data: { list: [] } });
    await expect(mod.fetchAllRolePermission()).resolves.toEqual({ list: [] });

    mocked.get.mockRejectedValueOnce(new Error('bad'));
    await expect(mod.fetchAllRolePermission()).resolves.toEqual({ success: false, data: [] });
  });

  test('fetchRoleById: success and error returns null', async () => {
    const mod = await import('../../../api/role&permission');
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.get.mockResolvedValueOnce({ data: { id: 'r1' } });
    await expect(mod.fetchRoleById('r1')).resolves.toEqual({ id: 'r1' });

    mocked.get.mockRejectedValueOnce(new Error('nope'));
    await expect(mod.fetchRoleById('r2')).resolves.toBeNull();
  });

  test('updateRolePermissions: success and rejection throws', async () => {
    const mod = await import('../../../api/role&permission');
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.put.mockResolvedValueOnce({ data: { ok: true } });
    await expect(mod.updateRolePermissions('u1', ['p1','p2'])).resolves.toEqual({ ok: true });

    mocked.put.mockRejectedValueOnce(new Error('deny'));
    await expect(mod.updateRolePermissions('u1', ['p1'])).rejects.toBeTruthy();
  });

  test('getRolebyIdUser: success and rejection throws', async () => {
    const mod = await import('../../../api/role&permission');
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.get.mockResolvedValueOnce({ data: { role: 'admin' } });
    await expect(mod.getRolebyIdUser('u1')).resolves.toEqual({ role: 'admin' });

    mocked.get.mockRejectedValueOnce(new Error('fail'));
    await expect(mod.getRolebyIdUser('u2')).rejects.toBeTruthy();
  });

  test('fetchAllUserRoles: success and error fallback', async () => {
    const mod = await import('../../../api/role&permission');
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    await expect(mod.fetchAllUserRoles()).resolves.toEqual([{ id: 1 }]);

    mocked.get.mockRejectedValueOnce(new Error('oops'));
    await expect(mod.fetchAllUserRoles()).resolves.toEqual({ success: false, data: [] });
  });

  test('createUserRole: success and rejection throws', async () => {
    const mod = await import('../../../api/role&permission');
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.post.mockResolvedValueOnce({ data: { id: 'new' } });
    await expect(mod.createUserRole({ user_id: 'u1', role_id: 'r1' })).resolves.toEqual({ id: 'new' });

    mocked.post.mockRejectedValueOnce(new Error('dup'));
    await expect(mod.createUserRole({ user_id: 'u2', role_id: 'r2' })).rejects.toBeTruthy();
  });

  test('deleteUserRolesByUser: success and rejection throws', async () => {
    const mod = await import('../../../api/role&permission');
    const mocked = jest.requireMock('../../../api/axiosInstance').default;
    mocked.delete.mockResolvedValueOnce({ data: { ok: true } });
    await expect(mod.deleteUserRolesByUser('u1')).resolves.toEqual({ ok: true });

    mocked.delete.mockRejectedValueOnce(new Error('locked'));
    await expect(mod.deleteUserRolesByUser('u1')).rejects.toBeTruthy();
  });
});
