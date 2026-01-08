import React from 'react';
import { render, screen } from '@testing-library/react';
import CycleTime from '../../../pages/Analytics/CycleTime';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/analytics/cycle-time' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}), { virtual: true });

describe('pages/Analytics/CycleTime', () => {
  it('renders without crashing', () => {
    const { container } = render(<CycleTime />);
    expect(container).toBeTruthy();
  });
});
