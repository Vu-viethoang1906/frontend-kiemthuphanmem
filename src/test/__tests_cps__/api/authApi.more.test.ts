import { loginApi, refreshTokenApi, logoutApi } from '../../../api/authApi';

// Mock axiosInstance with interceptors and methods
jest.mock('../../../api/axiosInstance', () => {
  const instance = {
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  } as any;
  return { __esModule: true, default: instance };
});

describe('authApi high-ROI branches', () => {
  beforeEach(() => {
    const mod = jest.requireMock('../../../api/axiosInstance');
    mod.default.post.mockReset?.();
    mod.default.get.mockReset?.();
    mod.default.delete.mockReset?.();
  });

  test('login success returns token payload (structure check)', async () => {
    const mod = jest.requireMock('../../../api/axiosInstance');
    mod.default.post.mockImplementation(async (url: string, data: any) => {
      expect(url).toContain('/auth/login');
      // implementation reads res.data.data
      return { data: { data: { token: 't', refreshToken: 'r' } } };
    });
    const res = await loginApi('u', 'p');
    expect(res).toBeDefined();
    expect(res.data?.token).toBeTruthy();
    expect(res.data?.refreshToken).toBeTruthy();
  });

  test('refresh token 401 propagates error', async () => {
    const mod = jest.requireMock('../../../api/axiosInstance');
    mod.default.post.mockImplementation(async (url: string) => {
      expect(url).toContain('/auth/refresh');
      const err: any = new Error('Unauthorized');
      err.response = { status: 401 };
      throw err;
    });
    // refreshTokenApi reads token from localStorage; ensure presence
    localStorage.setItem('refreshToken', 'bad');
    await expect(refreshTokenApi()).rejects.toBeDefined();
  });

  test('logout resolves when server returns success', async () => {
    const mod = jest.requireMock('../../../api/axiosInstance');
    mod.default.post.mockImplementation(async (url: string) => {
      expect(url).toContain('/auth/logout');
      return { data: { success: true } };
    });
    // ensure tokens exist so API branch executes
    localStorage.setItem('token', 't');
    localStorage.setItem('refreshToken', 'r');
    await expect(logoutApi()).resolves.toBeUndefined();
  });
});
