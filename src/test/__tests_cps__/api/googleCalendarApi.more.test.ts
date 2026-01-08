import { getGoogleCalendarStatus, getGoogleCalendarAuthUrl, disableGoogleCalendarSync } from '../../../api/googleCalendarApi';
import { apiWithAuth } from '../../../api/authApi';

jest.mock('../../../api/authApi', () => ({
  __esModule: true,
  apiWithAuth: jest.fn(),
}));

describe('googleCalendarApi additional branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('status: 503 triggers maintenance redirect behavior (handled upstream) and throws', async () => {
    const client = { get: jest.fn() } as any;
    (apiWithAuth as jest.Mock).mockReturnValue(client);
    client.get.mockRejectedValueOnce({ response: { status: 503 } });
    await expect(getGoogleCalendarStatus()).rejects.toBeDefined();
  });

  test('authUrl: malformed response rejects with error', async () => {
    const client = { get: jest.fn() } as any;
    (apiWithAuth as jest.Mock).mockReturnValue(client);
    client.get.mockResolvedValueOnce({ data: { url: 'https://auth.example' } });
    await expect(getGoogleCalendarAuthUrl()).rejects.toBeDefined();
  });

  test('disable sync: 401 rejects with error', async () => {
    const client = { post: jest.fn() } as any;
    (apiWithAuth as jest.Mock).mockReturnValue(client);
    client.post.mockRejectedValueOnce({ response: { status: 401 } });
    await expect(disableGoogleCalendarSync()).rejects.toBeDefined();
  });
});
