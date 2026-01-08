import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock fetchMyBoards to never resolve to keep loading true initially
jest.mock('../../../api/boardApi', () => ({
  __esModule: true,
  fetchMyBoards: jest.fn(() => new Promise(() => {})),
}));

// Minimal router + charts mocks
jest.mock('react-chartjs-2', () => ({
  __esModule: true,
  Line: () => <div data-testid="line-chart" />,
  Doughnut: () => <div data-testid="doughnut-chart" />,
}));
jest.mock('react-router-dom', () => ({ __esModule: true, useSearchParams: () => [new URLSearchParams(''), jest.fn()] }), { virtual: true });
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { error: jest.fn(), success: jest.fn() } }));

describe('Reports page (loading state)', () => {
  it('shows loading spinner and text while fetching initial boards', async () => {
  const { default: Reports } = await import('../../../pages/Reports/Reports');
    render(<Reports />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
});
