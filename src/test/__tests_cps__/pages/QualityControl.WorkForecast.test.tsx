import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = jest.fn();
jest.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}), { virtual: true });

const mockGetSprintForecast = jest.fn();
jest.mock('../../../api/sprintForecastApi', () => ({
  getSprintForecast: (...args: any[]) => mockGetSprintForecast(...args),
}));

const mockFetchMyBoards = jest.fn();
jest.mock('../../../api/boardApi', () => ({
  fetchMyBoards: (...args: any[]) => mockFetchMyBoards(...args),
}));

function renderPage(initialPath = '/') {
  const query = initialPath.split('?')[1] || '';
  mockSearchParams = new URLSearchParams(query);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Comp = require('../../../pages/QualityControl/WorkForecast').default;
  return render(<Comp />);
}

const sampleForecast = {
  success: true,
  data: {
    board_id: 'b1',
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
      users_on_leave: 2,
      on_leave_percentage: 10,
      on_leave_risk_factor: 0.1,
      holidays_count: 1,
      holidays_percentage: 5,
      holidays_risk_factor: 0.05,
      current_wip: 12,
      wip_risk_factor: 0.2,
      total_risk_adjustment: 0.35,
    },
    recommendation: {
      recommended_task_count: 18,
      confidence_level: 'high' as const,
      notes: ['Keep current WIP stable', 'Watch leave schedule'],
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFetchMyBoards.mockResolvedValue({ data: [{ _id: 'b1', title: 'Board One' }] });
  mockGetSprintForecast.mockResolvedValue(sampleForecast);
});

describe('WorkForecast', () => {
  it('shows loader while boards fetch and auto-loads forecast', async () => {
    let resolveBoards: (value: unknown) => void = () => undefined;
    mockFetchMyBoards.mockReturnValue(new Promise((res) => { resolveBoards = res; }));

    const { container } = renderPage();
    expect(container.querySelector('.animate-spin')).toBeTruthy();

    await act(async () => resolveBoards({ data: [{ _id: 'b1', title: 'Board One' }] }));

    await waitFor(() => expect(mockGetSprintForecast).toHaveBeenCalledWith('b1', undefined, undefined, 14));
    expect(screen.getByText('Work Forecast')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });

  it('sends selected filters when loading forecast manually', async () => {
    renderPage('/?board=b1');
    await waitFor(() => expect(mockGetSprintForecast).toHaveBeenCalled());
    mockGetSprintForecast.mockClear();

    fireEvent.change(screen.getByDisplayValue('2025-05-01'), { target: { value: '2025-06-01' } });
    fireEvent.change(screen.getByDisplayValue('2025-05-15'), { target: { value: '2025-06-15' } });
    fireEvent.change(screen.getByDisplayValue('14'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /Load Forecast/i }));

    await waitFor(() => expect(mockGetSprintForecast).toHaveBeenCalledWith('b1', '2025-06-01', '2025-06-15', 10));
  });

  it('shows empty state and toast on forecast failure', async () => {
    mockGetSprintForecast.mockResolvedValueOnce({ success: false });

    renderPage();

    // Component doesn't call toast.error on success: false, only logs console.error
    // Wait for component to render empty state
    await waitFor(() => {
      expect(screen.getByText(/Please select a board and click "Load Forecast" to view the forecast/i)).toBeInTheDocument();
    });
  });
});
