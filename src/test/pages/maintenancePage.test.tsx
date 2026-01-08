import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
const MaintenancePage = require('../../pages/MaintenancePage').default || require('../../pages/MaintenancePage.jsx');

test('renders MaintenancePage notice', async () => {
  const Comp = (MaintenancePage as any) || (() => null);
  render(<Comp />);
  // Match English UI labels present on the page
  const heading = await screen.findByText(/Maintenance Mode Management/i);
  expect(heading).toBeInTheDocument();
  const button = await screen.findByRole('button', { name: /Enable maintenance/i });
  expect(button).toBeInTheDocument();
});
