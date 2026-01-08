import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EstimationPanel from '../../components/Teacher/EstimationPanel';
import { fetchMyBoards } from '../../api/boardApi';
import { getTasksByBoard } from '../../api/teacherApi';
import { getEstimationAccuracy } from '../../api/analyticsApi';

jest.mock('../../api/boardApi');
jest.mock('../../api/teacherApi');
jest.mock('../../api/analyticsApi');

const mockFetchMyBoards = fetchMyBoards as jest.Mock;
const mockGetTasksByBoard = getTasksByBoard as jest.Mock;
const mockGetEstimationAccuracy = getEstimationAccuracy as jest.Mock;

describe('Teacher EstimationPanel data flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads board data and renders task metrics with breakdown', async () => {
    mockFetchMyBoards.mockResolvedValue({
      data: [{ _id: 'board-1', title: 'Board One' }],
    });

    mockGetTasksByBoard.mockResolvedValue({
      data: [
        {
          _id: 'task-1',
          title: 'Task A',
          assigned_to: { full_name: 'Alice' },
          estimate_hours: 2,
          created_at: '2024-01-01T00:00:00Z',
          done_at: '2024-01-01T04:00:00Z',
        },
      ],
    });

    mockGetEstimationAccuracy.mockResolvedValue({
      data: {
        overview: {
          totalTasks: 1,
          tasksWithEstimate: 1,
          averageEstimate: 2,
          averageActual: 4,
          averageError: 100,
          overEstimatedCount: 0,
          underEstimatedCount: 1,
          accurateCount: 0,
          overUnderRatio: 0,
          outliersCount: 0,
        },
        byUser: [
          {
            userId: 'u1',
            username: 'alice',
            fullName: 'Alice',
            statistics: {
              totalTasks: 1,
              averageEstimate: 2,
              averageActual: 4,
              averageError: 100,
              overEstimatedCount: 0,
              underEstimatedCount: 1,
              accurateCount: 0,
              categoryBreakdown: {
                severeOver: 0,
                moderateOver: 0,
                accurate: 0,
                moderateUnder: 0,
                severeUnder: 1,
              },
            },
          },
        ],
      },
    });

    render(<EstimationPanel />);

    const selector = await screen.findByRole('combobox');
    await screen.findByRole('option', { name: /Board One/i });
    await userEvent.selectOptions(selector, 'board-1');
    await userEvent.click(screen.getByRole('button', { name: /Load data/i }));

    const taskRow = await screen.findByText('Task A');
    const rowScope = within(taskRow.closest('[class*="grid"]') as HTMLElement);

    expect(rowScope.getByText('Alice')).toBeInTheDocument();
    expect(rowScope.getByText('2.00')).toBeInTheDocument();
    expect(rowScope.getByText('4.00')).toBeInTheDocument();
    expect(rowScope.getByText('2.00h')).toBeInTheDocument();
    expect(rowScope.getByText(/Under-estimated/i)).toBeInTheDocument();

    expect(await screen.findByText('+100.00%')).toBeInTheDocument();
    expect(screen.getByText(/Tasks:\s*1/i)).toBeInTheDocument();
  });

  it('surfaces backend error messages when fetching data fails', async () => {
    mockFetchMyBoards.mockResolvedValue({ data: [{ _id: 'b2', title: 'Board Two' }] });
    mockGetTasksByBoard.mockRejectedValue({ response: { data: { message: 'Server explode' } } });
    mockGetEstimationAccuracy.mockResolvedValue({ data: {} });

    render(<EstimationPanel />);

    const selector = await screen.findByRole('combobox');
    await screen.findByRole('option', { name: /Board Two/i });
    await userEvent.selectOptions(selector, 'b2');
    await userEvent.click(screen.getByRole('button', { name: /Load data/i }));

    await waitFor(() => {
      expect(screen.getByText('Server explode')).toBeInTheDocument();
    });
  });
});
