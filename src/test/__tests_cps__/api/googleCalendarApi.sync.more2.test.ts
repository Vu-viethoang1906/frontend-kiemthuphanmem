import '@testing-library/jest-dom';
import { enableGoogleCalendarSync, syncAllTasksToCalendar, unsyncAllTasksFromCalendar, getGoogleCalendarAuthUrl } from '../../../api/googleCalendarApi';
import { apiWithAuth } from '../../../api/authApi';

jest.mock('../../../api/authApi', () => ({
  __esModule: true,
  apiWithAuth: jest.fn(),
}));

describe('googleCalendarApi sync and OAuth message branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('enable sync: resolves on success and throws on failure', async () => {
    const client = { post: jest.fn() } as any;
    (apiWithAuth as jest.Mock).mockReturnValue(client);

    client.post.mockResolvedValueOnce({ data: { success: true } });
    await expect(enableGoogleCalendarSync({ only_with_dates: true })).resolves.toEqual({ success: true });

    client.post.mockResolvedValueOnce({ data: { success: false, message: 'bad filter' } });
    await expect(enableGoogleCalendarSync({})).rejects.toThrow('bad filter');
  });

  test('sync all: resolves on success and throws on failure', async () => {
    const client = { post: jest.fn() } as any;
    (apiWithAuth as jest.Mock).mockReturnValue(client);

    client.post.mockResolvedValueOnce({ data: { success: true } });
    await expect(syncAllTasksToCalendar()).resolves.toEqual({ success: true });

    client.post.mockResolvedValueOnce({ data: { success: false, message: 'sync failed' } });
    await expect(syncAllTasksToCalendar()).rejects.toThrow('sync failed');
  });

  test('unsync all: resolves on success and throws on failure', async () => {
    const client = { post: jest.fn() } as any;
    (apiWithAuth as jest.Mock).mockReturnValue(client);

    client.post.mockResolvedValueOnce({ data: { success: true } });
    await expect(unsyncAllTasksFromCalendar()).resolves.toEqual({ success: true });

    client.post.mockResolvedValueOnce({ data: { success: false, message: 'unsync failed' } });
    await expect(unsyncAllTasksFromCalendar()).rejects.toThrow('unsync failed');
  });

  test('authUrl: OAuth config error throws with guidance', async () => {
    const client = { get: jest.fn() } as any;
    (apiWithAuth as jest.Mock).mockReturnValue(client);
    client.get.mockResolvedValueOnce({ data: { success: false, message: 'OAuth not configured' } });
    await expect(getGoogleCalendarAuthUrl()).rejects.toThrow(/OAuth/);
  });
});
