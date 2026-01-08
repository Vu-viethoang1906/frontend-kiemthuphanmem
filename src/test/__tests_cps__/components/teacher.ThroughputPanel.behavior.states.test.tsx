import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('../../../api/analyticsApi', () => ({
  fetchTeacherThroughput: jest.fn(async () => ({ data: { items: [] } })),
}));

import ThroughputPanel from '../../../components/Teacher/ThroughputPanel';

describe('Teacher/ThroughputPanel behavior states', () => {
  beforeEach(() => jest.clearAllMocks());

  test('empty results state', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchTeacherThroughput.mockResolvedValueOnce({ data: { items: [] } });
    render(<ThroughputPanel />);
    // Assert specific heading to avoid multiple matches
    expect(await screen.findByText(/Throughput & Bottlenecks/i)).toBeInTheDocument();
    expect(screen.getByText(/Select a board to view|Loading boards/i)).toBeInTheDocument();
  });

  test('loaded state', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchTeacherThroughput.mockResolvedValueOnce({ data: { items: [{ label: 'Done', value: 12 }] } });
    render(<ThroughputPanel />);
    expect(await screen.findByText(/Throughput & Bottlenecks/i)).toBeInTheDocument();
    expect(await screen.findByText(/Entered/i)).toBeInTheDocument();
  });

  test('error state shows guidance', async () => {
    const api = require('../../../api/analyticsApi');
    api.fetchTeacherThroughput.mockRejectedValueOnce(new Error('server error'));
    render(<ThroughputPanel />);
    expect(await screen.findByText(/Select a board to view/i)).toBeInTheDocument();
  });
});
