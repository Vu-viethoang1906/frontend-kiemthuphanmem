import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ColumnManager from '../../../components/BoardSetting/ColumnManager';
import {
  fetchColumnsByBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  setDoneColumn,
  getDoneColumn,
} from '../../../api/columnApi';

jest.mock('../../../api/columnApi', () => ({
  fetchColumnsByBoard: jest.fn(),
  createColumn: jest.fn(),
  updateColumn: jest.fn(),
  deleteColumn: jest.fn(),
  reorderColumns: jest.fn(),
  setDoneColumn: jest.fn(),
  getDoneColumn: jest.fn(),
  updataIsDone: jest.fn(),
}));

jest.mock('../../../components/ModalProvider', () => ({
  useModal: () => ({
    show: jest.fn(),
    confirm: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ColumnManager', () => {
  const boardId = 'b1';
  const column = { _id: 'c1', name: 'Todo' };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetchColumnsByBoard as jest.Mock).mockResolvedValue({ data: [column] });
    (getDoneColumn as jest.Mock).mockRejectedValue(new Error('no done'));
  });

  it('loads and renders columns', async () => {
    render(<ColumnManager boardId={boardId} />);

    await waitFor(() => expect(screen.getByText('Todo')).toBeInTheDocument());
    expect(fetchColumnsByBoard).toHaveBeenCalledWith(boardId);
  });

  it('sets done column when button clicked', async () => {
    render(<ColumnManager boardId={boardId} />);

    await screen.findByText('Todo');
    fireEvent.click(screen.getByRole('button', { name: /Set Done/i }));

    await waitFor(() => expect(setDoneColumn).toHaveBeenCalledWith(boardId, 'c1'));
  });

  it('edits a column name and saves', async () => {
    render(<ColumnManager boardId={boardId} />);

    await screen.findByText('Todo');
    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));

    const input = screen.getByDisplayValue('Todo');
    fireEvent.change(input, { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => expect(updateColumn).toHaveBeenCalledWith('c1', { name: 'Updated' }));
  });

  it('deletes a column after confirm', async () => {
    render(<ColumnManager boardId={boardId} />);

    await screen.findByText('Todo');
    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => expect(deleteColumn).toHaveBeenCalledWith('c1'));
  });

  it('adds a column with done flag', async () => {
    render(<ColumnManager boardId={boardId} />);

    await screen.findByText('Todo');
    fireEvent.click(screen.getByRole('button', { name: /Add Column/i }));

    fireEvent.change(screen.getByPlaceholderText(/Enter column name/i), { target: { value: 'New Col' } });
    fireEvent.click(screen.getByLabelText(/Done column/i));
    fireEvent.click(screen.getByRole('button', { name: /^Add$/i }));

    await waitFor(() =>
      expect(createColumn).toHaveBeenCalledWith({
        board_id: boardId,
        name: 'New Col',
        order: 2,
        isdone: true,
      })
    );
  });
});
