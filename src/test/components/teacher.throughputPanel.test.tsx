import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
const ThroughputPanel = require('../../components/Teacher/ThroughputPanel').default;

test('renders ThroughputPanel with visible labels', async () => {
  render(<ThroughputPanel />);
  expect(await screen.findByText(/Throughput & Bottleneck/i)).toBeInTheDocument();
  expect(await screen.findByText(/Workflow throughput by column/i)).toBeInTheDocument();
});
