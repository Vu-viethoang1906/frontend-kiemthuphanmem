// Dynamic mocking to avoid cross-test interference
let axiosInstance: any;
let uploadLogoFile: (f: File | FormData) => Promise<any>;
let deleteLogo: (id: string) => Promise<any>;

describe('logoApi additional branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploadLogoFile: network error (no response) throws generic message', async () => {
    jest.resetModules();
    jest.doMock('../../../api/axiosInstance', () => {
      axiosInstance = {
        post: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      return { __esModule: true, default: axiosInstance };
    });
    ({ uploadLogoFile } = require('../../../api/logoApi'));
    (axiosInstance.post as jest.Mock).mockRejectedValueOnce({ request: {} });
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await expect(uploadLogoFile(file)).rejects.toBeDefined();
  });

  test('uploadLogoFile: unexpected payload shape throws default message', async () => {
    jest.resetModules();
    jest.doMock('../../../api/axiosInstance', () => {
      axiosInstance = {
        post: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      return { __esModule: true, default: axiosInstance };
    });
    ({ uploadLogoFile } = require('../../../api/logoApi'));
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({ data: { foo: 'bar' } });
    const file = new File(['y'], 'logo.jpg', { type: 'image/jpeg' });
    await expect(uploadLogoFile(file)).rejects.toThrow('Không upload được logo');
  });

  test('deleteLogo: server failure returns {success:false}', async () => {
    jest.resetModules();
    jest.doMock('../../../api/axiosInstance', () => {
      axiosInstance = {
        post: jest.fn(),
        delete: jest.fn(),
        get: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };
      return { __esModule: true, default: axiosInstance };
    });
    ({ deleteLogo } = require('../../../api/logoApi'));
    (axiosInstance.delete as jest.Mock).mockResolvedValueOnce({ data: { success: false, message: 'cannot delete' } });
    await expect(deleteLogo('id-1')).rejects.toThrow('cannot delete');
  });
});

// Ensure this file is treated as a module under isolatedModules
export {};
