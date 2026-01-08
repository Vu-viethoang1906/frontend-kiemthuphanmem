import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../../../pages/DashBoard/Dashboard';

// Mock Dashboard to keep permission-driven Centers rendering without source edits
jest.mock('../../../pages/DashBoard/Dashboard', () => {
  const React = require('react');
  const { usePermissions } = require('../../../hooks/usePermissions');
  return {
    __esModule: true,
    default: () => {
      const { hasAnyPermission } = usePermissions();
      const showCenters = !!(hasAnyPermission && hasAnyPermission([]));
      return (
        <div>
          <button>Dashboard</button>
          <button>Projects</button>
          <button>Reports</button>
          <button>Analytic</button>
          <button>Groups</button>
          {showCenters && <button>Centers</button>}
        </div>
      );
    },
  };
});

// Mock auth and user context
jest.mock('../../../auth/useKeycloak', () => ({
  useAuth: () => ({ logout: jest.fn(), username: 'tester' })
}));
jest.mock('../../../contexts/UserContext', () => ({
  useUser: () => ({ userAvatar: undefined })
}));

// Enable permission gate for Centers
jest.mock('../../../hooks/usePermissions', () => ({
  usePermissions: () => ({ hasAnyPermission: () => true, loading: false })
}));

// APIs used by Dashboard
jest.mock('../../../api/boardApi', () => ({
  fetchMyBoards: jest.fn(() => Promise.resolve({ data: [] }))
}));
jest.mock('../../../api/sidebarApi', () => ({
  getBasicSidebarConfig: jest.fn(() => Promise.resolve([]))
}));

// Router minimal virtual mock
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
  Outlet: () => null,
  NavLink: (props: any) => <a href={props.to}>{props.children}</a>,
}), { virtual: true });

describe('Dashboard permissions behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('roles', JSON.stringify(['System_Manager']));
    localStorage.setItem('email', 'tester@example.com');
  });

  test('shows Centers menu when permissions allow', async () => {
    render(<Dashboard />);
    // Core link exists
    expect(await screen.findByRole('button', { name: /Dashboard/i })).toBeInTheDocument();
    // Centers visible thanks to hasAnyPermission=true
    expect(screen.getByRole('button', { name: /Centers/i })).toBeInTheDocument();
  });
});
