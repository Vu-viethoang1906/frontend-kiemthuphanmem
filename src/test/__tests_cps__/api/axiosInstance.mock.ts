// Minimal axiosInstance mock for tests
const axiosInstanceMock: any = {
  get: jest.fn(async (...args: any[]) => ({ data: null })),
  post: jest.fn(async (...args: any[]) => ({ data: null })),
  put: jest.fn(async (...args: any[]) => ({ data: null })),
  delete: jest.fn(async (...args: any[]) => ({ data: null })),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

export default axiosInstanceMock;
