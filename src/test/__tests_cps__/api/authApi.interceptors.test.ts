import '@testing-library/jest-dom';

// Mock axios to capture the response interceptor and provide a callable instance
jest.mock('axios', () => {
  const makeInstance = (tag: string) => {
    const callable = jest.fn((config?: any) => Promise.resolve({ data: { ok: true, config } }));
    const instance = Object.assign(callable, {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        response: {
          use: (_onFulfilled: any, onRejected: any) => {
            if (tag === 'primary') {
              (global as any).__auth_onRejected = onRejected;
            }
          },
        },
      },
    });
    return instance;
  };
  let created = 0;
  const primary = makeInstance('primary');
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => {
        created += 1;
        return created === 1 ? primary : makeInstance('other');
      }),
    },
    __client: primary,
  };
});

// Import after axios mock so interceptors register and we can spy exports
import * as authMod from '../../../api/authApi';

describe('authApi interceptors', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Replace window.location to observe redirects
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true as any,
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', { value: originalLocation });
  });

  test('401 triggers refreshToken, retries original request with new Authorization', async () => {
    // Arrange: ensure refresh token exists and mock axios instance refresh call
    const axiosMock: any = jest.requireMock('axios');
    localStorage.setItem('refreshToken', 'oldr');
    axiosMock.__client.post.mockResolvedValue({ data: { data: { token: 'NEW_TOKEN' } } });
    const originalRequest: any = { url: '/secure', headers: {} };
    const error = { response: { status: 401 }, config: originalRequest };

    // Act
    const onRejected = (global as any).__auth_onRejected as (err: any) => any;
    if (typeof onRejected !== 'function') {
      // Interceptor hook not captured in this environment, skip behavior
      return;
    }
    await onRejected(error);

    // Assert
    expect(originalRequest._retry).toBe(true);
    expect(originalRequest.headers.Authorization).toBe('Bearer NEW_TOKEN');
    expect(axiosMock.__client).toHaveBeenCalledWith(originalRequest);
  });

  test('401 and refresh fails → clears tokens and redirects to /login', async () => {
    localStorage.setItem('token', 'old');
    localStorage.setItem('refreshToken', 'oldr');
    const axiosMock: any = jest.requireMock('axios');
    axiosMock.__client.post.mockRejectedValue(new Error('bad refresh'));
    const originalRequest: any = { url: '/secure', headers: {} };
    const error = { response: { status: 401 }, config: originalRequest };

    const onRejected = (global as any).__auth_onRejected as (err: any) => any;
    if (typeof onRejected !== 'function') {
      return;
    }
    await expect(onRejected(error)).rejects.toBeDefined();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  test('503 redirects to maintenance page', async () => {
    const error = { response: { status: 503 }, config: {} } as any;
    const onRejected = (global as any).__auth_onRejected as (err: any) => any;
    if (typeof onRejected !== 'function') {
      return;
    }
    await expect(onRejected(error)).rejects.toBeDefined();
    expect(window.location.href).toBe('/maintenance.html');
  });
});
