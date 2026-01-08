import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskQualityMetrics from '../../../pages/QualityControl/TaskQualityMetrics';
import { getTaskQualityMetrics } from '../../../api/taskQualityApi';
import { fetchMyBoards } from '../../../api/boardApi';

jest.mock(
  'react-router-dom',
  () => ({
    __esModule: true,
    MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSearchParams: () => [new URLSearchParams([['board', 'b1']]), jest.fn()],
  }),
  { virtual: true },
);

jest.mock('../../../api/taskQualityApi', () => ({
  getTaskQualityMetrics: jest.fn(),
}));

jest.mock('../../../api/boardApi', () => ({
  fetchMyBoards: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const sampleData = {
  board: { id: 'b1', title: 'Board 1' },
  summary: {
    totalTasks: 2,
    averageCommentsPerTask: 1.5,
    averageAttachmentsPerTask: 0.5,
    averageChurnCount: 1,
    averageCollaborationScore: 75,
    lowQualityTasksCount: 1,
    highChurnTasksCount: 1,
  },
  lowQualityTasks: [
    {
      task_id: 't1',
      title: 'Low Task',
      column_name: 'Todo',
      assigned_to: { username: 'alice' },
      commentCount: 0,
      attachmentCount: 0,
      collaborationScore: 20,
      warning: 'Low comments',
    },
  ],
  highChurnTasks: [
    {
      task_id: 't2',
      title: 'Churn Task',
      column_name: 'Doing',
      assigned_to: null,
      churnCount: 5,
      commentCount: 2,
      collaborationScore: 60,
      warning: 'Too much churn',
    },
  ],
  tasks: [
    {
      task_id: 't1',
      title: 'Low Task',
      column_name: 'Todo',
      assigned_to: { username: 'alice' },
      commentCount: 0,
      attachmentCount: 0,
      churnCount: 0,
      collaborationScore: 20,
    },
    {
      task_id: 't2',
      title: 'Churn Task',
      column_name: 'Doing',
      assigned_to: null,
      commentCount: 2,
      attachmentCount: 1,
      churnCount: 5,
      collaborationScore: 60,
    },
  ],
} as const;

describe('TaskQualityMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchMyBoards as jest.Mock).mockResolvedValue({ data: [{ _id: 'b1', title: 'Board 1' }] });
    (getTaskQualityMetrics as jest.Mock).mockResolvedValue(sampleData);
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/?board=b1']}>
        <TaskQualityMetrics />
      </MemoryRouter>,
    );

  it('loads boards, fetches metrics, and renders summary and tables', async () => {
    renderPage();

    await waitFor(() => expect(getTaskQualityMetrics).toHaveBeenCalledWith('b1'));

    expect(screen.getByText(/Total tasks/i)).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Avg comments/i).nextSibling).toHaveTextContent('1.5');
    expect(screen.getByText(/Avg collaboration score/i).nextSibling).toHaveTextContent('75');

    expect(
      screen.getByText((content) => content.includes('Low Quality Tasks (1)')),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Low Task').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Churn Task/).length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByRole('row')).toHaveLength(sampleData.tasks.length + 1); // header + rows
  });

  it('refreshes metrics when clicking refresh button', async () => {
    renderPage();

    await screen.findByText(/Total tasks/i);
    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));

    await waitFor(() => expect(getTaskQualityMetrics).toHaveBeenCalledTimes(2));
  });
});
