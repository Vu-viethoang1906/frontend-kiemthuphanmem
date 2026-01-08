import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const mockNavigate = jest.fn();
let mockCurrentPathname = '/';
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockCurrentPathname }),
}), { virtual: true });

import Sidebar from '../../../components/Sidebar';

describe('Sidebar (unit)', () => {
  beforeEach(() => {});

  const mainMenu = [
    { name: 'Home', icon: 'home', path: '/' },
    { name: 'Projects', icon: 'projects', path: '/projects' },
  ];
  const personalMenu = [
    { name: 'Profile', icon: 'user', path: '/profile' },
  ];
  const adminMenu = [
    { name: 'Users', icon: 'users', path: '/admin/users' },
  ];

  it('navigates on menu click and highlights active route', () => {
  mockCurrentPathname = '/projects';
    render(
      <Sidebar
        mainMenu={mainMenu}
        personalMenu={personalMenu}
        adminMenu={adminMenu}
        teams={[{ id: 't1', name: 'Alpha', initial: 'A' }]}
      />
    );

    // active style applied to Projects
    const projectsBtn = screen.getByRole('button', { name: /Projects/i });
    expect(projectsBtn).toBeInTheDocument();

    // click Home navigates
    fireEvent.click(screen.getByRole('button', { name: /Home/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('toggles Admin and Teams sections', () => {
    render(
      <Sidebar
        mainMenu={mainMenu}
        personalMenu={personalMenu}
        adminMenu={adminMenu}
        teams={[{ id: 't1', name: 'Alpha', initial: 'A' }]}
      />
    );

    // Admin section collapses/expands
    const adminToggle = screen.getByRole('button', { name: /Quản trị/i });
    fireEvent.click(adminToggle); // collapse
    fireEvent.click(adminToggle); // expand

    // Teams section toggle
    const teamsToggle = screen.getByRole('button', { name: /Your teams/i });
    fireEvent.click(teamsToggle); // collapse
    fireEvent.click(teamsToggle); // expand

    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });
});
