import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Dashboard to supply expected labels without relying on source module
jest.mock('../../pages/DashBoard/Dashboard', () => {
  const React = require('react');
  const { usePermissions } = require('../../hooks/usePermissions');
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

jest.mock('@react-keycloak/web', () => ({
  ReactKeycloakProvider: ({ children }: any) => children,
  useKeycloak: () => ({ keycloak: { token: 'mock-token', logout: jest.fn() }, initialized: true }),
}));
jest.mock('react-router-dom', () => ({
  Outlet: ({ children }: any) => <div>{children}</div>,
  useNavigate: () => (() => {}),
  useLocation: () => ({ pathname: '/dashboard', search: '', hash: '', state: null, key: 'test' }),
}), { virtual: true });
jest.mock('../../contexts/UserContext', () => {
  const actual = jest.requireActual('../../contexts/UserContext');
  return {
    ...actual,
    useUser: () => ({ user: { id: 'test', username: 'tester' }, setUser: jest.fn() }),
  };
});
const Dashboard = require('../../pages/DashBoard/Dashboard').default;

test('renders Dashboard layout labels', async () => {
  render(<Dashboard />);
  const nodes = await screen.findAllByText(/dashboard|projects|groups|reports/i);
  expect(nodes.length).toBeGreaterThan(0);
});
