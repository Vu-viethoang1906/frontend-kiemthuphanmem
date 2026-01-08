import React from 'react';
import { render, screen } from '@testing-library/react';
import Throughput from '../../../pages/Analytics/Throughput';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/analytics/throughput' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}), { virtual: true });

describe('pages/Analytics/Throughput', () => {
  it('renders without crashing', () => {
    const { container } = render(<Throughput />);
    expect(container).toBeTruthy();
  });
});
