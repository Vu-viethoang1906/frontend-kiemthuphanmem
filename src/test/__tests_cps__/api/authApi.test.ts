import '@testing-library/jest-dom';
import axios from 'axios';
import { loginApi, refreshTokenApi, getMe, logoutApi, getKeycloakUser, apiWithAuth } from '../../../api/authApi';

var mockClient: any;

jest.mock('axios', () => {
  mockClient = {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: { response: { use: jest.fn() } },
  };
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockClient),
    },
  };
});

describe('authApi behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('login: returns tokens on success and throws on failure', async () => {
    mockClient.post.mockReset();
    // success shape must match implementation: res.data.data.token/refreshToken
    mockClient.post.mockResolvedValueOnce({ data: { data: { token: 't1', refreshToken: 'rt1' } } });
    const res = await loginApi('u', 'p');
    expect(res).toEqual({ data: { token: 't1', refreshToken: 'rt1' } });
    expect(localStorage.getItem('token')).toBe('t1');
    expect(localStorage.getItem('refreshToken')).toBe('rt1');

    // failure branch: reject with Error
    mockClient.post.mockRejectedValueOnce(new Error('invalid'));
    await expect(loginApi('u', 'bad')).rejects.toThrow('invalid');
  });

  test('refreshToken: returns new token and throws on missing refresh token', async () => {
    mockClient.post.mockReset();
    // success path: set refreshToken in storage and mock response shape
    localStorage.setItem('refreshToken', 'rt1');
    mockClient.post.mockResolvedValueOnce({ data: { data: { token: 'newToken' } } });
    const res = await refreshTokenApi();
    expect(res).toBe('newToken');
    expect(localStorage.getItem('token')).toBe('newToken');

    // failure when refresh token missing
    localStorage.removeItem('refreshToken');
    await expect(refreshTokenApi()).rejects.toThrow('Không có refresh token');
  });

  test('getProfile: returns profile on success', async () => {
    mockClient.get?.mockReset?.();
    const createFn = ((axios as any).create ?? (axios as any).default?.create) as jest.Mock;
    createFn.mockImplementation(() => ({
      get: jest.fn().mockResolvedValue({ data: { data: { id: '1', name: 'Ken' } } }),
    }));
    const me = await getMe();
    expect(me).toEqual({ data: { id: '1', name: 'Ken' } });
  });

  test('logout: returns server payload on success', async () => {
    mockClient.post.mockReset();
    // ensure tokens exist so logout goes through API path
    localStorage.setItem('token', 't');
    localStorage.setItem('refreshToken', 'r');
    mockClient.post.mockResolvedValueOnce({ data: { success: true } });
    await expect(logoutApi()).resolves.toEqual({ success: true });
  });

  test('logout: when tokens missing clears storage and returns failure payload', async () => {
    // ensure no tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    const res = await logoutApi();
    expect(res).toEqual({ success: false, message: 'Token không tồn tại' });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('Type_login')).toBeNull();
  });

  test('logout: API error branch clears tokens and resolves undefined', async () => {
    // setup tokens so API path is taken
    localStorage.setItem('token', 't');
    localStorage.setItem('refreshToken', 'r');
    mockClient.post.mockRejectedValueOnce(new Error('server down'));
    await expect(logoutApi()).resolves.toBeUndefined();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('Type_login')).toBeNull();
  });

  test('getKeycloakUser: throws when token missing', async () => {
    // no token present
    localStorage.removeItem('token');
    await expect(getKeycloakUser('uid-x')).rejects.toThrow('Không có token');
  });

  test('getKeycloakUser: returns nested data when success true', async () => {
    (mockClient.get as jest.Mock).mockReset();
    (mockClient.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: { id: 'u1', name: 'Ken' } } });
    localStorage.setItem('token', 't');
    const user = await getKeycloakUser('u1');
    expect(user).toEqual({ id: 'u1', name: 'Ken' });
  });

  test('getKeycloakUser: returns raw data when success flag missing', async () => {
    (mockClient.get as jest.Mock).mockReset();
    (mockClient.get as jest.Mock).mockResolvedValueOnce({ data: { ok: true } });
    localStorage.setItem('token', 't');
    const user = await getKeycloakUser('u2');
    expect(user).toEqual({ ok: true });
  });

  test('apiWithAuth: prefers provided token over localStorage', () => {
    const createFn = ((axios as any).create ?? (axios as any).default?.create) as jest.Mock;
    createFn.mockClear();
    localStorage.setItem('token', 'LOCAL');
    apiWithAuth('EXPLICIT');
    const opts = createFn.mock.calls[0]?.[0];
    expect(opts.headers.Authorization).toBe('Bearer EXPLICIT');
  });
});
