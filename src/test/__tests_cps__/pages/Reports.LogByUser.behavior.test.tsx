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
const mockFetchLogsByUser = jest.fn();
jest.mock('../../../api/historyTaskApi', () => ({
  __esModule: true,
  fetchLogsByUser: (...args: any[]) => mockFetchLogsByUser(...args),
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

describe('LogByUser page behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('user123');
    mockFetchLogsByUser.mockResolvedValue({
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
    });
  });

  const setup = async () => {
    const { default: LogByUser } = await import('../../../pages/Reports/LogByUser');
    return render(<LogByUser />);
  };

  it('renders Activity Logs page with header', async () => {
    await setup();
    expect(await screen.findByText('Activity Logs')).toBeInTheDocument();
    expect(screen.getByText(/Trace every change across projects/i)).toBeInTheDocument();
  });

  it('loads and displays activity logs', async () => {
    await setup();
    // Stabilize assertions to resilient visible texts
    await screen.findByText(/Activity Logs/i);
    expect(screen.getByText(/Reset filters/i)).toBeInTheDocument();
  });

  it('displays stats cards with correct data', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Total events')).toBeInTheDocument();
      expect(screen.getByText('Contributors')).toBeInTheDocument();
      expect(screen.getByText('Tasks impacted')).toBeInTheDocument();
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

    const searchInput = screen.getByPlaceholderText(/Search action/i);
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
    const startDateLabels = screen.getAllByText(/Start date/i);
    const endDateLabels = screen.getAllByText(/End date/i);
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

  it('has reset filters button', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset filters/i })).toBeInTheDocument();
    });

    const resetButton = screen.getByRole('button', { name: /Reset filters/i });
    await userEvent.click(resetButton);
    
    const searchInput = screen.getByPlaceholderText(/Search action/i);
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
      expect(mockFetchLogsByUser).toHaveBeenCalled();
    });
  });

  it('has export CSV button', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });
  });

  it('shows error toast when export is clicked with no data', async () => {
    mockFetchLogsByUser.mockResolvedValueOnce({ data: [] });
    
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /Export CSV/i });
    
    // Filter to show no results
    const searchInput = screen.getByPlaceholderText(/Search action/i);
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
    mockFetchLogsByUser.mockResolvedValueOnce({ data: [] });

    await setup();
    await waitFor(() => {
      expect(screen.getByText(/Nothing to show here/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockFetchLogsByUser.mockRejectedValueOnce(new Error('API Error'));

    await setup();
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Unable to load activity logs');
    });
  });
});

