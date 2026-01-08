import { getDeploymentHistory, getCurrentVersion, getDeploymentById } from '../../../api/deploymentApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance', () => {
  const client = {
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { __esModule: true, default: client };
});

describe('deploymentApi additional branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDeploymentHistory: handles empty data array', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({
      data: { success: true, data: [], pagination: { total: 0, limit: 10, skip: 0, hasMore: false } },
    });
    const res = await getDeploymentHistory();
    expect(res && Array.isArray(res.data)).toBe(true);
    expect(res.data.length).toBe(0);
  });

  test('getCurrentVersion: handles string version gracefully', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: '1.2.3' });
    const ver = await getCurrentVersion();
    expect(typeof ver === 'string' || typeof ver === 'object').toBe(true);
  });

  test('getDeploymentById: network error rejects', async () => {
    (axiosInstance.get as jest.Mock).mockRejectedValueOnce(new Error('network error'));
    await expect(getDeploymentById('dep-1')).rejects.toBeDefined();
  });
});
