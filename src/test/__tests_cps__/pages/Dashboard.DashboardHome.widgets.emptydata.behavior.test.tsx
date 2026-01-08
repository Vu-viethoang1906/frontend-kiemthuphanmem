import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalProvider } from '../../../components/ModalProvider';

// Reduce import-time router impact
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });
jest.mock('react-hot-toast', () => ({ Toaster: () => null, toast: { success: jest.fn(), error: jest.fn() } }));

// Mock analytics API if dashboard home fetches data via it
jest.mock('../../api/analyticsApi', () => ({
  getDashboardSummary: jest.fn().mockResolvedValue({ data: { widgets: [] } }),
}), { virtual: true });

const DashboardHome = require('../../../pages/DashBoard/DashboardHome').default;

describe('DashboardHome widgets with empty data', () => {
  test('renders empty state or hides widgets when no data', async () => {
    render(
      <ModalProvider>
        <DashboardHome />
      </ModalProvider>
    );

    // Expect an empty-state copy or absence of common widget titles
    const possibleEmptyState = await screen.findAllByText(/no data|chưa có dữ liệu|empty/i);
    expect(possibleEmptyState.length).toBeGreaterThan(0);
  });
});
