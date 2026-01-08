import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('../../../api/analyticsApi', () => ({
  fetchEstimationPerformance: jest.fn(async () => ({ data: { items: [] } })),
}));

import EstimationPanel from '../../../components/Teacher/EstimationPanel';

describe('Teacher/EstimationPanel behavior states', () => {
  beforeEach(() => jest.clearAllMocks());

  test('empty results state', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchEstimationPerformance.mockResolvedValueOnce({ data: { items: [] } });
    render(<EstimationPanel />);
    // Guidance text when no board selected
    expect(await screen.findByText(/Select a board to view estimation accuracy/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a board to view estimation accuracy/i)).toBeInTheDocument();
  });

  test('loaded state', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchEstimationPerformance.mockResolvedValueOnce({ data: { items: [{ label: 'Task A', value: 3 }] } });
    render(<EstimationPanel />);
    // Main heading
    expect(await screen.findByText(/Estimate vs Actual/i)).toBeInTheDocument();
    // Table headers present
    expect(await screen.findByText(/Estimate \(h\)/i)).toBeInTheDocument();
  });

  test('error state shows guidance', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchEstimationPerformance.mockRejectedValueOnce(new Error('server error'));
    render(<EstimationPanel />);
    expect(await screen.findByText(/Select a board to view estimation accuracy/i)).toBeInTheDocument();
  });
});
