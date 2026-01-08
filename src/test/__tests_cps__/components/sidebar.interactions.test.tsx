import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock router hooks ONLY (leave API calls unmocked; we provide teams prop directly)
const mockNavigate = jest.fn();
let mockCurrentPathname = '/dashboard/home';
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockCurrentPathname }),
}), { virtual: true });

import Sidebar from '../../../components/Sidebar';

describe('Sidebar interactions', () => {
  const mainMenu = [
    { name: 'Home', icon: 'home', path: '/dashboard/home' },
  ];
  const personalMenu = [
    { name: 'Profile', icon: 'user', path: '/dashboard/profile' },
  ];
  const adminMenu = [
    { name: 'Users', icon: 'users', path: '/admin/users' },
  ];
  const teams = [
    { id: 'g1', name: 'Beta', initial: 'B' },
    { id: 'g2', name: 'Gamma', initial: 'G' },
    { id: 'g3', name: 'Omega', initial: 'O' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentPathname = '/dashboard/home';
  });

  it('shows collapsed team tooltips then expands to show names', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 }); // trigger auto-collapse
    render(
      <Sidebar
        mainMenu={mainMenu}
        personalMenu={personalMenu}
        adminMenu={adminMenu}
        teams={teams}
      />
    );

    // Collapsed: team buttons exist via title attribute
    expect(screen.getByTitle('Beta')).toBeInTheDocument();
    expect(screen.getByTitle('Gamma')).toBeInTheDocument();

    // Expand sidebar
    const expandBtn = screen.getByTitle('Expand');
    await userEvent.click(expandBtn);

    // Now full names visible
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('navigates using admin basePath when current route is /admin', async () => {
    mockCurrentPathname = '/admin/users';
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1300 }); // desktop (not collapsed)
    render(
      <Sidebar
        mainMenu={mainMenu}
        personalMenu={personalMenu}
        adminMenu={adminMenu}
        teams={teams}
      />
    );

    // Team button visible with text
    const betaBtn = screen.getByRole('button', { name: /Beta/i });
    await userEvent.click(betaBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/admin/groups/g1');
  });

  it('toggles the Admin section (expand/collapse)', async () => {
    mockCurrentPathname = '/dashboard/home';
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1300 });
    render(
      <Sidebar
        mainMenu={mainMenu}
        personalMenu={personalMenu}
        adminMenu={adminMenu}
        teams={teams}
      />
    );
    // Admin header present
    const adminHeader = screen.getByRole('button', { name: /Quản trị/i });
    // Initially expanded on desktop: Users item visible
    expect(screen.getByRole('button', { name: /Users/i })).toBeInTheDocument();

    await userEvent.click(adminHeader); // collapse
    // Users hidden when collapsed
    expect(screen.queryByRole('button', { name: /Users/i })).toBeNull();

    await userEvent.click(adminHeader); // expand
    expect(screen.getByRole('button', { name: /Users/i })).toBeInTheDocument();
  });
});
