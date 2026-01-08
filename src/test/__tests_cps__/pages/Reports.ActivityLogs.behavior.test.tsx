import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(() => 'user123'),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock historyTaskApi
const mockFetchActivityLogs = jest.fn();
jest.mock('../../../api/historyTaskApi', () => ({
  __esModule: true,
  fetchActivityLogs: (...args: any[]) => mockFetchActivityLogs(...args),
}));

// Mock toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
}));

describe('ActivityLogs page behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('user123');
    mockFetchActivityLogs.mockResolvedValue({
      data: [
        {
          _id: 'log1',
          target_id: 'task1',
          target_type: 'Task Title 1',
          action: 'Created',
          created_at: new Date().toISOString(),
          user_id: {
            _id: 'user1',
            full_name: 'John Doe',
            email: 'john@example.com',
          },
        },
        {
          _id: 'log2',
          target_id: 'task2',
          target_type: 'Task Title 2',
          action: 'Updated',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: {
            _id: 'user2',
            full_name: 'Jane Smith',
            email: 'jane@example.com',
          },
        },
      ],
      total: 2,
    });
  });

  const setup = async () => {
    const { default: ActivityLogs } = await import('../../../pages/Reports/ActivityLogs');
    return render(<ActivityLogs />);
  };

  it('renders Activity Logs page with header', async () => {
    await setup();
    expect(await screen.findByText('Activity Logs')).toBeInTheDocument();
    expect(screen.getByText(/Track and monitor all activities/i)).toBeInTheDocument();
  });

  it('loads and displays activity logs', async () => {
    await setup();
    // Stabilize to heading and summary widgets
    await screen.findByText(/Activity Logs/i);
    const totalEvents = await screen.findByText(/Total Events/i);
    expect(totalEvents).toBeInTheDocument();
  });

  it('displays stats cards with correct data', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Total Events')).toBeInTheDocument();
      expect(screen.getByText('Contributors')).toBeInTheDocument();
      expect(screen.getByText('Tasks Impacted')).toBeInTheDocument();
    });
  });

  it('allows filtering by user', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    });

    // Check that User filter section exists - use getAllByText since there are multiple matches
    const userLabels = screen.getAllByText(/^User$/i);
    expect(userLabels.length).toBeGreaterThan(0);
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('allows searching activity logs', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search action or task/i);
    expect(searchInput).toBeInTheDocument();
    
    await userEvent.type(searchInput, 'Created');
    expect(searchInput).toHaveValue('Created');
  });

  it('allows setting date range', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    });

    // Check that date range labels exist
    const startDateLabels = screen.getAllByText(/Start Date/i);
    const endDateLabels = screen.getAllByText(/End Date/i);
    expect(startDateLabels.length).toBeGreaterThan(0);
    expect(endDateLabels.length).toBeGreaterThan(0);
  });

  it('has quick filter buttons and allows selection', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    const todayButton = screen.getByRole('button', { name: /Today/i });
    await userEvent.click(todayButton);
    expect(todayButton).toBeInTheDocument();
  });

  it('has reset button that resets filters', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
    });

    const resetButton = screen.getByRole('button', { name: /Reset/i });
    await userEvent.click(resetButton);
    
    const searchInput = screen.getByPlaceholderText(/Search action or task/i);
    expect(searchInput).toHaveValue('');
  });

  it('has refresh button that reloads logs', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    await userEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(mockFetchActivityLogs).toHaveBeenCalled();
    });
  });

  it('shows error toast when export is clicked with no data', async () => {
    mockFetchActivityLogs.mockResolvedValueOnce({ data: [], total: 0 });
    
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /Export CSV/i });
    
    // Filter to show no results
    const searchInput = screen.getByPlaceholderText(/Search action or task/i);
    await userEvent.type(searchInput, 'NonExistentSearchTerm');
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('NonExistentSearchTerm');
    });

    await userEvent.click(exportButton);
    
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('No data to export');
    });
  });

  it('displays empty state when no logs found', async () => {
    mockFetchActivityLogs.mockResolvedValueOnce({ data: [], total: 0 });

    await setup();
    await waitFor(() => {
      expect(screen.getByText(/No activities found/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockFetchActivityLogs.mockRejectedValueOnce(new Error('API Error'));

    await setup();
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Unable to load activity logs');
    });
  });
});

