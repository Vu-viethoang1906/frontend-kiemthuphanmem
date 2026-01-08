import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as boardApi from '../../../api/boardApi';

// Mock Chart.js components used by react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  __esModule: true,
  Line: (props: any) => <div data-testid="line-chart" />, 
  Doughnut: (props: any) => <div data-testid="doughnut-chart" />,
}));

jest.mock('../../../api/boardApi', () => ({
  __esModule: true,
  // Return empty to exercise the "no boards" branch deterministically
  fetchMyBoards: jest.fn().mockResolvedValue([])
}));
jest.mock('../../../api/analyticsApi', () => ({
  __esModule: true,
  getLineChartData: jest.fn().mockResolvedValue({ success: true, data: { data: [{ date: new Date().toISOString(), total: 1, completed: 1, inProgress: 0, overdue: 0 }] } }),
  getBoardPerformance: jest.fn().mockResolvedValue({ success: true, data: { stats: { totalTasks: 1, completedTasks: 1, inProgressTasks: 0, overdueTasks: 0 } } }),
}));
jest.mock('../../../api/taskApi', () => ({ __esModule: true, fetchTasksByBoard: jest.fn().mockResolvedValue({ success: true, data: [] }) }));
// Mock only what Reports.tsx uses from react-router-dom
jest.mock('react-router-dom', () => ({
  __esModule: true,
  useSearchParams: () => [new URLSearchParams('board=b1'), jest.fn()],
}), { virtual: true });
// Toast mock
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));

describe('Reports page behavior (no boards branch)', () => {
  const setup = async () => {
  const { default: Reports } = await import('../../../pages/Reports/Reports');
    return render(<Reports />);
  };

    it('renders empty state when user has no boards', async () => {
      await setup();
      // Assert on heading exact text per UI
      expect(await screen.findByText('Reports & Analytics')).toBeInTheDocument();
      // Assert on empty state exact copy per UI
      expect(screen.getByText('No boards available')).toBeInTheDocument();
  });

  // Additional interactive tests (filters, export) are covered in interactions suite.

    it('does not render filters or charts when there are no boards', async () => {
      await setup();
    expect(await screen.findByText('Reports & Analytics')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('doughnut-chart')).not.toBeInTheDocument();
  });
});
