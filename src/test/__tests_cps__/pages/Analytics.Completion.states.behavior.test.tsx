import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}), { virtual: true });
jest.mock('../../../socket', () => ({ socket: { on: jest.fn(), off: jest.fn() } }));

jest.mock('../../../api/analyticsApi', () => ({
  fetchCompletion: jest.fn(async () => ({ data: { completion: [] } })),
}));

import CompletionPage from '../../../pages/Analytics/Completion';

describe('Analytics/Completion behavior states', () => {
  beforeEach(() => jest.clearAllMocks());

  test('empty results state', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchCompletion.mockResolvedValueOnce({ data: { completion: [] } });
    render(<CompletionPage />);
    expect(await screen.findByText(/Completion Speed Analysis/i)).toBeInTheDocument();
  });

  test('loaded data state', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchCompletion.mockResolvedValueOnce({ data: { completion: [ { date: '2025-12-01', rate: 0.7 } ] } });
    render(<CompletionPage />);
    expect(await screen.findByText(/Completion Speed Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Board/i)).toBeInTheDocument();
  });

  test('error state falls back to empty', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchCompletion.mockRejectedValueOnce(new Error('bad gateway'));
    render(<CompletionPage />);
    expect(await screen.findByText(/No data available/i)).toBeInTheDocument();
  });
});
