import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Safe router stubs
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/admin', search: '' }),
  useSearchParams: () => [new URLSearchParams('')],
  Outlet: () => null,
  NavLink: (props: any) => <a href={props.to}>{props.children}</a>,
}), { virtual: true });

// Mock UserContext to avoid provider requirements
jest.mock('../../contexts/UserContext', () => {
  const actual = jest.requireActual('../../contexts/UserContext');
  return {
    ...actual,
    useUser: () => ({ user: { id: 'u1', name: 'Smoke' }, setUser: jest.fn() }),
  };
});

// Mock auth hook
jest.mock('../../auth/useKeycloak', () => ({
  useAuth: () => ({ logout: jest.fn(), username: 'smoke-user' }),
}));

// Minimal API/sidebar mocks often used by admin pages
jest.mock('../../api/sidebarApi', () => ({
  getBasicSidebarConfig: jest.fn(() => Promise.resolve([])),
}));

import AdminHome from '../../pages/Admin/AdminHome';

describe('Smoke: Admin Home page renders', () => {
  test('renders and shows admin heading', async () => {
    render(<AdminHome />);

    // Expect at least one Admin-related heading present
    const adminHeadings = await screen.findAllByRole('heading', { name: /Admin/i });
    expect(adminHeadings.length).toBeGreaterThan(0);
  });
});
