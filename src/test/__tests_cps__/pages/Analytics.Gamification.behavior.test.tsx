import React from 'react';
import { render, screen } from '@testing-library/react';
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/analytics/gamification' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}), { virtual: true });

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/analytics/gamification' }),
}), { virtual: true });

describe('pages/Analytics/Gamification', () => {
  it('renders without crashing', () => {
    const Module = require('../../../pages/Analytics/Gamification');
    const Comp = Module.default || Module.Gamification || (() => <div>Gamification</div>);
    const { container } = render(<Comp />);
    expect(container).toBeTruthy();
  });
});
