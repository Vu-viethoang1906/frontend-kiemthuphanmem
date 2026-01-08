import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ThroughputPanel from '../../components/Teacher/ThroughputPanel';
import { server } from '../test-utils/msw.server';
import { rest } from 'msw';

beforeAll(() => {
  server.use(
    rest.get('*/teacher/throughput', (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ success: true, data: [] }));
    })
  );
});

describe('Teacher ThroughputPanel - empty data', () => {
  it('renders panel title and empty state without crashing', async () => {
    render(<ThroughputPanel />);
    await waitFor(() => {
      // Title is localized
      expect(screen.getByText(/Throughput & Bottlenecks/i)).toBeInTheDocument();
    });
  });
});
