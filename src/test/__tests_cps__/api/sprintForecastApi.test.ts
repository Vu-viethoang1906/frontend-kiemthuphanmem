import { getSprintForecast } from '../../../api/sprintForecastApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const sampleResponse = {
  success: true,
  data: {
    board_id: 'board-1',
    next_sprint: {
      start_date: '2025-05-01T00:00:00Z',
      end_date: '2025-05-15T00:00:00Z',
      duration_days: 14,
    },
    historical_velocity: {
      average: 20,
      from_sprints: 5,
      period: { start: '2025-01-01', end: '2025-04-30' },
    },
    confidence_interval: { min: 15, max: 25, percentage: '90%' },
    risk_factors: {
      users_on_leave: 1,
      on_leave_percentage: 5,
      on_leave_risk_factor: 0.05,
      holidays_count: 0,
      holidays_percentage: 0,
      holidays_risk_factor: 0,
      current_wip: 10,
      wip_risk_factor: 0.1,
      total_risk_adjustment: 0.15,
    },
    recommendation: {
      recommended_task_count: 18,
      confidence_level: 'high' as const,
      notes: ['Keep current WIP stable'],
    },
  },
};

describe('sprintForecastApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches forecast with only board id (empty params)', async () => {
    mockAxios.get.mockResolvedValue({ data: sampleResponse });

    const result = await getSprintForecast('board-1');

    expect(mockAxios.get).toHaveBeenCalledWith('/sprint-forecast/board/board-1/forecast', { params: {} });
    expect(result).toEqual(sampleResponse);
  });

  it('sends optional sprint params when provided', async () => {
    mockAxios.get.mockResolvedValue({ data: sampleResponse });

    await getSprintForecast('board-2', '2025-06-01', '2025-06-15', 10);

    expect(mockAxios.get).toHaveBeenCalledWith('/sprint-forecast/board/board-2/forecast', {
      params: {
        next_sprint_start: '2025-06-01',
        next_sprint_end: '2025-06-15',
        sprint_duration_days: 10,
      },
    });
  });
});
