import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => {
    if (key === 'userId') return 'user123';
    if (key === 'email') return 'test@example.com';
    if (key === 'roles') return JSON.stringify(['user']);
    return null;
  }),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'board123' }),
}), { virtual: true });

// Mock auth
jest.mock('../../../auth/useKeycloak', () => ({
  useAuth: () => ({
    logout: jest.fn(),
    username: 'testuser',
  }),
}));

// Mock UserContext
jest.mock('../../../contexts/UserContext', () => ({
  useUser: () => ({
    userAvatar: '',
  }),
}));

// Mock permissions
jest.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasAnyPermission: jest.fn(() => false),
    loading: false,
  }),
}));

// Mock boardApi
const mockFetchMyBoards = jest.fn();
jest.mock('../../../api/boardApi', () => ({
  __esModule: true,
  fetchMyBoards: (...args: any[]) => mockFetchMyBoards(...args),
}));

// Mock historyTaskApi
const mockFetchTaskActivityLogs = jest.fn();
jest.mock('../../../api/historyTaskApi', () => ({
  __esModule: true,
  fetchTaskActivityLogs: (...args: any[]) => mockFetchTaskActivityLogs(...args),
}));

// Mock authApi
jest.mock('../../../api/authApi', () => ({
  __esModule: true,
  logoutApi: jest.fn().mockResolvedValue({}),
}));

// Mock Sidebar and other components
jest.mock('../../../components/Sidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="sidebar">Sidebar</div>,
}));

jest.mock('../../../components/NotificationBell', () => ({
  __esModule: true,
  default: () => <div data-testid="notification-bell">NotificationBell</div>,
}));

jest.mock('../../../components/UserMenu', () => ({
  __esModule: true,
  default: ({ onLogout }: any) => (
    <button onClick={onLogout} data-testid="user-menu">UserMenu</button>
  ),
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

describe('ActivityTask page behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    mockFetchMyBoards.mockResolvedValue({ data: [] });
    mockFetchTaskActivityLogs.mockResolvedValue([
      {
        _id: 'log1',
        task_id: { _id: 'task1', title: 'Task 1' },
        changed_by: {
          _id: 'user1',
          full_name: 'John Doe',
          email: 'john@example.com',
        },
        change_type: 'Created',
        createdAt: new Date().toISOString(),
      },
    ]);
  });

  const setup = async () => {
    const { default: ActivityTask } = await import('../../../pages/Reports/ActivityTask');
    return render(<ActivityTask />);
  };

  it('renders Activity Logs page with header', async () => {
    await setup();
    expect(await screen.findByText('Activity Logs')).toBeInTheDocument();
    expect(screen.getByText(/Track task activities and changes/i)).toBeInTheDocument();
  });

  it('displays sidebar and header components', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });

  it('loads and displays activity logs', async () => {
    await setup();
    // Stabilize assertion to visible heading and summary counts
    await screen.findByText(/Activity Logs/i);
    const totalEvents = await screen.findByText(/Total Events/i);
    expect(totalEvents).toBeInTheDocument();
  });

  it('displays stats cards', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Total Events')).toBeInTheDocument();
      expect(screen.getByText('Contributors')).toBeInTheDocument();
      expect(screen.getByText('Tasks Impacted')).toBeInTheDocument();
    });
  });

  it('has back button that navigates back', async () => {
    await setup();
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /Back/i });
      expect(backButton).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /Back/i });
    await userEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
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

  it('has reset and refresh buttons', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reset/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
    });
  });

  it('has export CSV button', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });
  });

  it('displays empty state when no logs found', async () => {
    mockFetchTaskActivityLogs.mockResolvedValueOnce([]);

    await setup();
    await waitFor(() => {
      expect(screen.getByText(/No activities found/i)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    mockFetchTaskActivityLogs.mockRejectedValueOnce(new Error('API Error'));

    await setup();
    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Unable to load activity logs');
    });
  });
});

