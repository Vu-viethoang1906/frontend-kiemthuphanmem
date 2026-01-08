import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CycleTime from '../../../pages/Analytics/CycleTime';
jest.mock('react-router-dom', () => ({
  Navigate: ({ children }: any) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/analytics/cycle-time' }),
  useSearchParams: () => [new URLSearchParams(''), jest.fn()],
}), { virtual: true });

jest.mock('../../../api/analyticsApi', () => ({
  getCycleTime: jest.fn(async () => ({ data: [] })),
}));

describe('Analytics CycleTime behavior: basic render', () => {
  test('renders heading text and empty-state copy', async () => {
    render(<CycleTime />);
    const heading = await screen.findByText(/Cycle Time Analysis/i);
    expect(heading).toBeInTheDocument();
    const emptyCopy = await screen.findByText(/No data available/i);
    expect(emptyCopy).toBeInTheDocument();
  });
});
