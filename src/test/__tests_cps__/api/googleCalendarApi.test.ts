import '@testing-library/jest-dom';
import { getGoogleCalendarStatus, getGoogleCalendarAuthUrl, disableGoogleCalendarSync } from '../../../api/googleCalendarApi';
import * as authApi from '../../../api/authApi';

jest.mock('../../../api/authApi', () => ({
  __esModule: true,
  apiWithAuth: jest.fn(),
}));

describe('googleCalendarApi behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getCalendarStatus: returns status and throws on failure', async () => {
    const client = { get: jest.fn(), post: jest.fn() };
    (authApi.apiWithAuth as jest.Mock).mockReturnValue(client);
    client.get.mockResolvedValueOnce({ data: { success: true, data: { isConnected: true } } });
    const status = await getGoogleCalendarStatus();
    expect(status.isConnected).toBe(true);

    client.get.mockResolvedValueOnce({ data: { success: false, message: 'unauthorized' } });
    await expect(getGoogleCalendarStatus()).rejects.toThrow('unauthorized');
  });

  test('connectCalendar: returns auth url and throws on failure', async () => {
    const client2 = { get: jest.fn(), post: jest.fn() };
    (authApi.apiWithAuth as jest.Mock).mockReturnValue(client2);
    client2.get.mockResolvedValueOnce({ data: { success: true, data: { authUrl: '/auth' } } });
    const url = await getGoogleCalendarAuthUrl();
    expect(url).toBe('/auth');

    client2.get.mockResolvedValueOnce({ data: { success: false, message: 'error' } });
    await expect(getGoogleCalendarAuthUrl()).rejects.toThrow('error');
  });

  test('disconnectCalendar: resolves on success and throws on failure', async () => {
    const client3 = { get: jest.fn(), post: jest.fn() };
    (authApi.apiWithAuth as jest.Mock).mockReturnValue(client3);
    client3.post.mockResolvedValueOnce({ data: { success: true } });
    await expect(disableGoogleCalendarSync()).resolves.toBeDefined();

    client3.post.mockResolvedValueOnce({ data: { success: false, message: 'failed' } });
    await expect(disableGoogleCalendarSync()).rejects.toThrow('failed');
  });
});
