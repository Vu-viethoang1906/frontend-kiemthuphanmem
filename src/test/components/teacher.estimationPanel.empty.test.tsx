import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import EstimationPanel from '../../components/Teacher/EstimationPanel';
import { server } from '../test-utils/msw.server';
import { rest } from 'msw';

beforeAll(() => {
  server.use(
    rest.get('*/teacher/estimation', (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({ success: true, data: [] }));
    })
  );
});

describe('Teacher EstimationPanel - empty data', () => {
  it('renders panel title and empty state without crashing', async () => {
    render(<EstimationPanel />);
    await waitFor(() => {
      // Title is localized
      expect(screen.getByText(/Estimate\s*vs\s*Actual/i)).toBeInTheDocument();
    });
  });
});
