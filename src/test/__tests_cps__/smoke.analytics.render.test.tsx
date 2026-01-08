import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Safe router stubs
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/analytics/performance', search: '' }),
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

// Minimal API mocks used by analytics pages
jest.mock('../../api/analyticsApi', () => ({
  getCentersPerformance: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../../api/sidebarApi', () => ({
  getBasicSidebarConfig: jest.fn(() => Promise.resolve([])),
}));

import CentersPerformance from '../../pages/Analytics/CentersPerformance';

describe('Smoke: Analytics Centers Performance page renders', () => {
  test('renders and shows analytics heading', async () => {
    render(<CentersPerformance />);

    // Expect a heading or label indicating Centers Performance/Analytics
    expect(await screen.findByText(/Centers Performance Comparison/i)).toBeInTheDocument();

    // No navigation assertions; ensure page renders core heading
  });
});
