import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock router pieces
const mockNavigate = jest.fn();
jest.mock(
  'react-router-dom',
  () => ({
    __esModule: true,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
    Outlet: () => <div data-testid="outlet" />,
  }),
  { virtual: true },
);

// Mock leaf UI to keep render cheap
jest.mock('../../../components/Sidebar', () => (props: any) => (
  <div data-testid="sidebar">
    {props.mainMenu?.map((item: any) => (
      <button key={item.path}>{item.name}</button>
    ))}
  </div>
));
jest.mock('../../../components/NotificationBell', () => () => <div data-testid="bell" />);
jest.mock('../../../components/UserMenu', () => (props: any) => (
  <button data-testid="user-menu" onClick={props.onLogout}>User</button>
));

// Mock hooks/apis
jest.mock('../../../auth/useKeycloak', () => ({
  useAuth: () => ({ logout: jest.fn(), username: 'tester' }),
}));
jest.mock('../../../contexts/UserContext', () => ({
  useUser: () => ({ userAvatar: 'avatar.png' }),
}));
jest.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ hasAnyPermission: () => true, loading: false }),
}));

const mockFetchMyBoards = jest.fn(async (...args: any[]) => ({ data: [{ _id: 'b1', title: 'Board 1' }] })) as any;
jest.mock('../../../api/boardApi', () => ({
  fetchMyBoards: (...args: any[]) => mockFetchMyBoards(...args),
}));

const mockGetBasicSidebarConfig = jest.fn(async (...args: any[]) => []) as any;
jest.mock('../../../api/sidebarApi', () => ({
  getBasicSidebarConfig: (...args: any[]) => mockGetBasicSidebarConfig(...args),
}));

const mockGetAllCenters = jest.fn(async (...args: any[]) => ({ data: [{ _id: 'c1', name: 'Center 1' }] })) as any;
jest.mock('../../../api/centerApi', () => ({
  getAllCenters: (...args: any[]) => mockGetAllCenters(...args),
}));

// Mock logout API invoked in handleLogout
jest.mock('../../../api/authApi', () => ({
  logoutApi: jest.fn(async () => ({})),
}));

// Stable Date
const FIXED_DATE = '2024-06-01';

import Dashboard from '../../../pages/DashBoard/Dashboard';

describe('Dashboard real component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('roles', JSON.stringify(['admin']));
    localStorage.setItem('email', 'tester@example.com');
  });

  it('renders selectors, shortcuts, and outlet with fetched boards/centers', async () => {
    render(<Dashboard />);

    expect(await screen.findByTestId('sidebar')).toBeInTheDocument();
    await waitFor(() => expect(mockFetchMyBoards).toHaveBeenCalled());
    await waitFor(() => expect(mockGetAllCenters).toHaveBeenCalled());

    // Shortcuts from analyticsShortcuts use useMemo
    expect(screen.getByRole('button', { name: 'Throughput' })).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('navigates to analytics throughput when clicking shortcut', async () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole('button', { name: 'Throughput' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringContaining('/dashboard/analytics/throughput'),
    );
  });

  it('broadcasts refresh event with current filters', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    render(<Dashboard />);

    fireEvent.click(await screen.findByRole('button', { name: /Refresh data/i }));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'dashboard-analytics-refresh' }),
    );
    dispatchSpy.mockRestore();
  });
});
