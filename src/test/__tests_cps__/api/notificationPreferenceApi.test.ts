import axiosInstance from '../../../api/axiosInstance';
import { notificationPreferenceApi } from '../../../api/notificationPreferenceApi';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('notificationPreferenceApi', () => {
  const prefs = {
    user_id: 'u1',
    smart_scheduling_enabled: true,
    urgent_types: ['critical'],
    min_delay_minutes: 5,
    max_delay_minutes: 60,
    quiet_hours: { enabled: true, start_hour: 22, end_hour: 7 },
    active_days: [1, 2, 3, 4, 5],
  };

  const pattern = {
    user_id: 'u1',
    active_hours: [9, 10],
    deep_work_periods: [{ day_of_week: 1, start_hour: 9, end_hour: 11 }],
    optimal_notification_times: [{ day_of_week: 1, hours: [10, 15] }],
    metrics: {
      average_daily_active_hours: 6,
      most_active_day: 2,
      least_active_day: 6,
      average_session_duration: 45,
    },
    confidence_score: 0.8,
    last_analyzed_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getPreferences fetches preferences', async () => {
    mockAxios.get.mockResolvedValue({ data: prefs });

    const result = await notificationPreferenceApi.getPreferences();

    expect(mockAxios.get).toHaveBeenCalledWith('/notification-preferences');
    expect(result).toEqual(prefs);
  });

  it('updatePreferences sends partial payload', async () => {
    mockAxios.put.mockResolvedValue({ data: prefs });
    const payload = { smart_scheduling_enabled: false, urgent_types: [] };

    const result = await notificationPreferenceApi.updatePreferences(payload);

    expect(mockAxios.put).toHaveBeenCalledWith('/notification-preferences', payload);
    expect(result).toEqual(prefs);
  });

  it('analyzeActivity defaults to 30 days when omitted', async () => {
    mockAxios.post.mockResolvedValue({ data: pattern });

    const result = await notificationPreferenceApi.analyzeActivity();

    expect(mockAxios.post).toHaveBeenCalledWith('/notification-preferences/analyze-activity', { days: 30 });
    expect(result).toEqual(pattern);
  });

  it('analyzeActivity accepts custom days', async () => {
    mockAxios.post.mockResolvedValue({ data: pattern });

    await notificationPreferenceApi.analyzeActivity(7);

    expect(mockAxios.post).toHaveBeenCalledWith('/notification-preferences/analyze-activity', { days: 7 });
  });

  it('getActivityPattern returns pattern on success', async () => {
    mockAxios.get.mockResolvedValue({ data: pattern });

    const result = await notificationPreferenceApi.getActivityPattern();

    expect(mockAxios.get).toHaveBeenCalledWith('/notification-preferences/activity-pattern');
    expect(result).toEqual(pattern);
  });

  it('getActivityPattern returns null on 404', async () => {
    const error404 = { response: { status: 404 } } as any;
    mockAxios.get.mockRejectedValue(error404);

    const result = await notificationPreferenceApi.getActivityPattern();

    expect(result).toBeNull();
  });

  it('getActivityPattern rethrows non-404 errors', async () => {
    const error500 = { response: { status: 500 }, message: 'server' } as any;
    mockAxios.get.mockRejectedValue(error500);

    await expect(notificationPreferenceApi.getActivityPattern()).rejects.toEqual(error500);
  });
});
