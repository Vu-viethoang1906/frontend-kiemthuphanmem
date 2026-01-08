import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
const EstimationPanel = require('../../components/Teacher/EstimationPanel').default;

test('renders EstimationPanel with visible labels', async () => {
  render(<EstimationPanel />);
  // Match English headings used in the component
  expect(await screen.findByText(/Estimate vs Actual/i)).toBeInTheDocument();
  expect(await screen.findByText(/Average deviation/i)).toBeInTheDocument();
});
