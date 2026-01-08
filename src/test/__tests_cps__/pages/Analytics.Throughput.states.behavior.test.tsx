import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Minimal router mock to avoid dependency on real router
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}), { virtual: true });

// Mock APIs used inside Analytics/Throughput page
jest.mock('../../../api/analyticsApi', () => ({
  fetchThroughput: jest.fn(async () => ({ data: { throughput: [] } })),
}));

// Socket safe mock
jest.mock('../../../socket', () => ({ socket: { on: jest.fn(), off: jest.fn() } }));

import ThroughputPage from '../../../pages/Analytics/Throughput';

describe('Analytics/Throughput behavior states', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with empty results gracefully', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchThroughput.mockResolvedValueOnce({ data: { throughput: [] } });
    render(<ThroughputPage />);
    // Heading or label presence confirms render; avoid charts internals
    expect(await screen.findByText(/Throughput Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/no data/i)).toBeTruthy();
  });

  test('renders with loaded data', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchThroughput.mockResolvedValueOnce({ data: { throughput: [ { date: '2025-12-01', count: 5 } ] } });
    render(<ThroughputPage />);
    expect(await screen.findByText(/Throughput Analysis/i)).toBeInTheDocument();
    // Assert presence of filter controls; avoid chart internals
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('shows empty state on API failure', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchThroughput.mockRejectedValueOnce(new Error('network error'));
    render(<ThroughputPage />);
    expect(await screen.findByText(/No data available/i)).toBeInTheDocument();
  });
});
