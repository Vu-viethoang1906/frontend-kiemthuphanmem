export const logoutApi = jest.fn(async (...args: any[]) => ({}));
export const loginApi = jest.fn(async (...args: any[]) => ({ token: 'mock' }));
export const getProfile = jest.fn(async (...args: any[]) => ({ data: { username: 'tester' } }));
