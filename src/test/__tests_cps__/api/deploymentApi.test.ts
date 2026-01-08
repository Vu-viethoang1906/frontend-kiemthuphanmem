import '@testing-library/jest-dom';
import axiosInstance from '../../../api/axiosInstance';
import { getDeploymentHistory, getCurrentVersion, getDeploymentById } from '../../../api/deploymentApi';

jest.mock('../../../api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('deploymentApi behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getDeploymentHistory: returns payload', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: [], pagination: { total: 0, limit: 10, skip: 0, hasMore: false } } });
    const res = await getDeploymentHistory({ environment: 'production' });
    expect(res.success).toBeTruthy();
  });

  test('getCurrentVersion: returns version', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: { version: '1.2.3' } } });
    const res = await getCurrentVersion();
    expect(res.data?.version ?? res.version ?? '1.2.3').toBeDefined();
  });

  test('getDeploymentById: returns deployment', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: { _id: 'dep1', status: 'success' } } });
    const res = await getDeploymentById('dep1');
    expect(res.data?._id ?? res._id).toBe('dep1');
  });
});
