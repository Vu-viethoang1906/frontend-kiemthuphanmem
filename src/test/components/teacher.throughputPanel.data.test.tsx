import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThroughputPanel from '../../components/Teacher/ThroughputPanel';
import { fetchMyBoards } from '../../api/boardApi';
import { getThroughputAndCFD } from '../../api/analyticsApi';

jest.mock('../../api/boardApi');
jest.mock('../../api/analyticsApi');
jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => <div data-testid="mock-line-chart" {...props} />,
}));

const mockFetchMyBoards = fetchMyBoards as jest.Mock;
const mockGetThroughputAndCFD = getThroughputAndCFD as jest.Mock;

describe('Teacher ThroughputPanel data flows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads throughput data and renders flow, bottleneck, WIP, and CFD tables', async () => {
    mockFetchMyBoards.mockResolvedValue({
      data: [{ _id: 'board-1', title: 'Board One' }],
    });

    mockGetThroughputAndCFD.mockResolvedValue({
      data: {
        columnFlow: {
          Todo: { entered: 2, exited: 1 },
          Doing: { entered: 1, exited: 1 },
        },
        columnAvgTimes: { Doing: 12, Review: 36 },
        cfd: [
          { date: '2024-01-03', Todo: 3, Doing: 1 },
          { date: '2024-01-02', Todo: 2, Doing: 2 },
          { date: '2024-01-01', Todo: 1, Doing: 3 },
        ],
        wipViolations: {
          Doing: [
            { date: '2024-01-03', count: 4 },
            { date: '2024-01-02', count: 2 },
          ],
        },
      },
    });

    render(<ThroughputPanel />);

    const selector = await screen.findByRole('combobox');
    await screen.findByRole('option', { name: /Board One/i });
    const loadButton = await screen.findByRole('button', { name: /load data/i });
    await userEvent.selectOptions(selector, 'board-1');
    await userEvent.click(loadButton);

    await screen.findByText('Review, Doing');

    const flowSection = screen.getByText('Workflow throughput by column');
    const flowTable = flowSection.parentElement?.querySelector('table') as HTMLElement;
    const flowBody = flowTable.querySelector('tbody') as HTMLElement;
    expect(within(flowBody).getByText('Todo')).toBeInTheDocument();
    expect(within(flowBody).getByText('Doing')).toBeInTheDocument();
    expect(within(flowBody).getAllByText('1')[0]).toBeInTheDocument();
    expect(screen.getByText('36.00h')).toBeInTheDocument();
    expect(screen.getByText(/2024-01-03: 4 tasks/)).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('shows API error message when throughput fetch fails', async () => {
    mockFetchMyBoards.mockResolvedValue({ data: [{ _id: 'board-err', title: 'Board Err' }] });
    mockGetThroughputAndCFD.mockRejectedValue(new Error('throughput failed'));

    render(<ThroughputPanel />);

    const selector = await screen.findByRole('combobox');
    await screen.findByRole('option', { name: /Board Err/i });
    await userEvent.selectOptions(selector, 'board-err');
    await userEvent.click(screen.getByRole('button', { name: /load data/i }));

    await waitFor(() => {
      expect(screen.getByText(/throughput failed/i)).toBeInTheDocument();
    });
  });
});
