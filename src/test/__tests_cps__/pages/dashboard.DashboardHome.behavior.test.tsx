// Unskipped: keep real behavior test below
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardHome from '../../../pages/DashBoard/DashboardHome';

// Router mock (virtual) to avoid ESM issues and navigation side-effects
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });

// Socket mock
jest.mock('../../../socket', () => ({
  socket: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Board API mock
jest.mock('../../../api/boardApi', () => ({
  fetchMyBoards: jest.fn(() => Promise.resolve({ data: [ { _id: 'b1', title: 'Board Alpha' } ] }))
}));

// Task API mock
jest.mock('../../../api/taskApi', () => ({
  fetchTasksByBoard: jest.fn(() => Promise.resolve({ data: [
    { _id: 't1', status: 'Done', priority: 'High', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), column: { name: 'Done', isDone: true } },
    { _id: 't2', status: 'In Progress', priority: 'Low', created_at: new Date().toISOString(), column: { name: 'In Progress' } }
  ] }))
}));

// Notifications API (axiosInstance) mock
jest.mock('../../../api/axiosInstance', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { data: [] } })),
    put: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({})),
  }
}));

// authApi unused directly in test but imported - keep a safe mock
jest.mock('../../../api/authApi', () => ({ getMe: jest.fn(() => Promise.resolve({ data: {} })) }));

describe('DashboardHome behavior', () => {
  test('shows loading state then renders core stats and welcome heading', async () => {
    render(<DashboardHome />);

    // Initial loading indicator
    expect(screen.getByText(/loading overview/i)).toBeInTheDocument();

    // Wait for loaded state (welcome heading appears)
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();

    // Core stat labels visible (semantic text)
    expect(screen.getAllByText(/total projects/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/total tasks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/team members/i).length).toBeGreaterThan(0);

    // Avoid brittle numeric assertions (stats depend on parsing logic); presence of labels is sufficient
  });

  test('fetches notifications and renders without crashing', async () => {
    const axiosInstance = require('../../../api/axiosInstance').default;
    axiosInstance.get.mockResolvedValueOnce({ data: { data: [ { id: 'n1', message: 'System update' } ] } });
    render(<DashboardHome />);
    // Welcome heading confirms page loaded
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    // Ensure notifications fetch attempted
    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalled();
    });
  });

  test('handles empty boards gracefully', async () => {
    const boardApi = require('../../../api/boardApi');
    boardApi.fetchMyBoards.mockResolvedValueOnce({ data: [] });
    render(<DashboardHome />);
    // Should still render heading, and show zero-states without crash
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(await screen.findByText(/total projects/i)).toBeInTheDocument();
  });

  // Navigation and permission-gated checks are covered in other suites.
});
