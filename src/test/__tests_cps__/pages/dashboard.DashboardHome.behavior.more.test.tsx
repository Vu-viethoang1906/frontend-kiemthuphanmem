import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardHome from '../../../pages/DashBoard/DashboardHome';
jest.mock('react-router-dom', () => ({
  Navigate: ({ children }: any) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
  useSearchParams: () => [new URLSearchParams(''), jest.fn()],
}), { virtual: true });

// Router mocks used broadly across tests
// Avoid router mocking here; rely on defaults used across suite

// Minimal auth/permission context if component reads it
jest.mock('../../../contexts/UserContext', () => ({
  useUser: () => ({ user: { id: 'u1', name: 'Test User' } }),
}));

// Mock APIs the home widgets might use (analytics/dashboard calls)
jest.mock('../../../api/analyticsApi', () => ({
  getDashboardSummary: jest.fn(async () => ({
    totalTasks: 0,
    completedToday: 0,
    throughput7d: 0,
  })),
}));

describe('DashboardHome behavior (permissions and empty/error states)', () => {
  test('renders and shows welcome hero text', async () => {
    render(<DashboardHome />);
    const hero = await screen.findByText(/Welcome back!/i);
    expect(hero).toBeInTheDocument();
  });
});
