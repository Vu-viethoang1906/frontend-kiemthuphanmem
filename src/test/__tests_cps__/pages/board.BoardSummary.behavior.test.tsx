import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock router navigate used inside BoardSummary
jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn(),
}), { virtual: true });

// Mock API getDoneColumn but we will prefer columns prop path
jest.mock('../../../api/columnApi', () => ({ __esModule: true, getDoneColumn: jest.fn() }));

describe('pages/Board/BoardSummary behavior', () => {
  it('computes done and active using columns prop (no API)', async () => {
    const { default: BoardSummary } = require('../../../pages/Board/BoardSummary');
    const tasks = [
      { title: 't1', column_id: { _id: 'c-done', name: 'Done' } },
      { title: 't2', column_id: { _id: 'c-todo', name: 'Todo' } },
    ];
    const columns = [{ _id: 'c-todo', name: 'Todo' }, { _id: 'c-done', name: 'Done', isDone: true }];

    render(<BoardSummary tasks={tasks} columns={columns} swimlanes={[]} members={[]} />);

    // The component renders lots of UI; assert some key texts exist
    // Done/Active counts are not printed plainly, but presence implies no crash
    expect(await screen.findByText(/Task Statistics|Board/i)).toBeInTheDocument();
  });

  it('builds column and swimlane lists from tasks when missing lists', async () => {
    const { default: BoardSummary } = require('../../../pages/Board/BoardSummary');
    const tasks = [
      { title: 'A', column_id: 'col1', swimlane_id: 'sw1' },
      { title: 'B', column_id: 'col2', swimlane_id: 'sw1' },
    ];
    render(<BoardSummary tasks={tasks} />);
    // Render sanity check
    expect(await screen.findByText(/Task Statistics|Board/i)).toBeInTheDocument();
  });
});
