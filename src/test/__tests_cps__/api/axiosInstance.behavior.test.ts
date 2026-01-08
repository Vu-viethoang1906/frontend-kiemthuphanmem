import '@testing-library/jest-dom';

// We will capture interceptors registered by axiosInstance.ts and invoke them
// directly to exercise its logic without touching production code.

describe('axiosInstance interceptors (direct coverage)', () => {
  const reqHandlers: any[] = [];
  const resFulfilledHandlers: any[] = [];
  const resRejectedHandlers: any[] = [];

  beforeEach(() => {
    // Reset captured handlers
    reqHandlers.length = 0;
    resFulfilledHandlers.length = 0;
    resRejectedHandlers.length = 0;

    // Mock axios module before importing axiosInstance
    jest.resetModules();
    jest.doMock('axios', () => {
      const instance: any = jest.fn((config: any) => Promise.resolve({ config }))
      instance.interceptors = {
        request: {
          use: (onFulfilled: any) => {
            reqHandlers.push(onFulfilled);
            return 0;
          },
        },
        response: {
          use: (onFulfilled: any, onRejected: any) => {
            resFulfilledHandlers.push(onFulfilled);
            resRejectedHandlers.push(onRejected);
            return 0;
          },
        },
      };
      const axiosPost = jest.fn();
      return {
        __esModule: true,
        default: { create: () => instance, post: axiosPost },
        create: () => instance,
        post: axiosPost,
      };
    });

    // Stable window.location mutation
    const original = window.location;
    // @ts-ignore
    delete (window as any).location;
    // @ts-ignore
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    jest.dontMock('axios');
    jest.resetModules();
    localStorage.clear();
  });

  test('request interceptor sets Authorization and removes Content-Type for FormData', async () => {
    const { default: axiosInstance } = await import('../../../api/axiosInstance');
    expect(axiosInstance).toBeTruthy();
    expect(reqHandlers.length).toBeGreaterThan(0);

    localStorage.setItem('token', 'abc');
    const form = new FormData();
    const config: any = { headers: { 'Content-Type': 'application/json' }, data: form };
    const modified = await reqHandlers[0](config);
    expect(modified.headers.Authorization).toBe('Bearer abc');
    expect(modified.headers['Content-Type']).toBeUndefined();
  });

  test('response 413 and 503 redirect to maintenance', async () => {
    await import('../../../api/axiosInstance');
    const onRejected = resRejectedHandlers[0];
    expect(typeof onRejected).toBe('function');

    // 413
    try {
      await onRejected({ response: { status: 413 }, config: {} });
    } catch {}
    expect(window.location.href).toContain('/maintenance.html');

    // reset
    (window as any).location.href = '';

    // 503
    try {
      await onRejected({ response: { status: 503 }, config: {} });
    } catch {}
    expect(window.location.href).toContain('/maintenance.html');
  });

  test('Network Error redirects to maintenance', async () => {
    await import('../../../api/axiosInstance');
    const onRejected = resRejectedHandlers[0];
    await onRejected({ message: 'Network Error', config: {} });
    expect(window.location.href).toContain('/maintenance.html');
  });

  test('401 without refresh token redirects to /login', async () => {
    await import('../../../api/axiosInstance');
    const onRejected = resRejectedHandlers[0];
    try {
      await onRejected({ response: { status: 401 }, config: {} });
    } catch {}
    expect(window.location.href).toContain('/login');
  });

  test('401 then refresh success: stores tokens and retries original request', async () => {
    // Arrange axios mock to resolve refresh
    const mod = await import('axios');
    const axiosMock: any = mod;
    axiosMock.post.mockResolvedValue({ data: { data: { token: 'newAT', refreshToken: 'newRT' } } });

    const { default: axiosInstance }: any = await import('../../../api/axiosInstance');
    const onRejected = resRejectedHandlers[0];

    localStorage.setItem('refreshToken', 'rt');
    const origReq: any = { headers: {}, _retry: false };
    const res = await onRejected({ response: { status: 401 }, config: origReq });

    // Should call instance (our function mock returns a promise that resolves with config)
    const resolved = await res;
    expect(localStorage.getItem('token')).toBe('newAT');
    expect(localStorage.getItem('refreshToken')).toBe('newRT');
    expect(resolved.config.headers.Authorization).toBe('Bearer newAT');
  });

  test('401 then refresh fails: clears storage and redirects to /login', async () => {
    // Arrange axios mock to reject refresh
    const mod = await import('axios');
    const axiosMock: any = mod;
    axiosMock.post.mockRejectedValue(new Error('refresh failed'));

    await import('../../../api/axiosInstance');
    const onRejected = resRejectedHandlers[0];
    localStorage.setItem('refreshToken', 'rt');
    try {
      await onRejected({ response: { status: 401 }, config: {} });
    } catch {}
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(window.location.href).toContain('/login');
  });
});
