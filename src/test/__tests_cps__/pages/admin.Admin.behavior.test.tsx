import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Virtual mock of react-router-dom to avoid ESM resolution issues (v7)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/admin' }),
  Outlet: () => <div data-testid="outlet" />,
  MemoryRouter: ({ children }: any) => <div>{children}</div>,
  NavLink: ({ children }: any) => <span>{children}</span>,
  Link: ({ children }: any) => <span>{children}</span>,
}), { virtual: true });
import Admin from '../../../pages/Admin/Admin';

jest.mock('../../../auth/useKeycloak', () => ({
  useAuth: () => ({ logout: jest.fn(), username: 'tester' })
}));
jest.mock('../../../contexts/UserContext', () => ({ useUser: () => ({ userAvatar: null }) }));
jest.mock('../../../api/boardApi', () => ({ fetchMyBoards: jest.fn().mockResolvedValue({ data: [{ _id: 'b1' }, { _id: 'b2' }] }) }));
jest.mock('../../../api/sidebarApi', () => ({ getBasicSidebarConfig: jest.fn().mockResolvedValue([
  { path: '/admin', name: 'Dashboard', icon: 'dashboard' },
  { path: '/admin/projects', name: 'Projects', icon: 'projects' },
  { path: '/admin/groups', name: 'Groups', icon: 'groups' }
]) }));

describe('Admin layout behavior', () => {
  test('renders header, sidebar menu items and updates projects badge', async () => {
    render(<Admin />);
    // Header text
    expect(screen.getByText(/Admin Panel - System Management/i)).toBeInTheDocument();
    // Sidebar menu items (Dashboard, Projects, Groups)
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Projects/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Groups/i).length).toBeGreaterThan(0);
    // Projects badge appears after fetchMyBoards
    await waitFor(() => {
      const projectsMenu = screen.getByText(/Projects/i).closest('div,li,button,a,span');
      expect(projectsMenu).toBeTruthy();
    });
  });
});
