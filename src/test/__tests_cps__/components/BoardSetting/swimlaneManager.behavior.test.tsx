import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SwimlaneManager from '../../../../components/BoardSetting/SwimlaneManager';

// Mocks
jest.mock('../../../../api/swimlaneApi', () => ({
  fetchSwimlanesByBoard: jest.fn(),
  createSwimlane: jest.fn(),
  updateSwimlane: jest.fn(),
  deleteSwimlane: jest.fn(),
  toggleCollapseSwimlane: jest.fn(),
}));

// Mock useModal hook to avoid provider requirements
const mockShow = jest.fn();
const mockConfirm = jest.fn();
jest.mock('../../../../components/ModalProvider', () => ({
  useModal: () => ({ show: mockShow, confirm: mockConfirm }),
}));

// Mock toast named import shape used by component
jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// Extract the mocks for API calls
import * as swimlaneApi from '../../../../api/swimlaneApi';

describe('SwimlaneManager behavior', () => {
  const boardId = 'board-xyz';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading then empty state', async () => {
    (swimlaneApi.fetchSwimlanesByBoard as jest.Mock).mockResolvedValue({ data: [] });

    render(<SwimlaneManager boardId={boardId} />);

    expect(screen.getByText(/loading swimlanes/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(swimlaneApi.fetchSwimlanesByBoard).toHaveBeenCalledWith(boardId);
    });

    await waitFor(() => {
      expect(screen.getByText(/No swimlanes found/i)).toBeInTheDocument();
    });
  });

  it('adds a new swimlane via modal', async () => {
    (swimlaneApi.fetchSwimlanesByBoard as jest.Mock).mockResolvedValueOnce({ data: [] });
    (swimlaneApi.createSwimlane as jest.Mock).mockResolvedValueOnce({ success: true });

    const onChange = jest.fn();
    render(<SwimlaneManager boardId={boardId} onSwimlanesChange={onChange} />);

    // open modal
    await waitFor(() => expect(swimlaneApi.fetchSwimlanesByBoard).toHaveBeenCalled());
    const openBtn = await screen.findByRole('button', { name: /add swimlane/i });
    await userEvent.click(openBtn);

    const input = screen.getByPlaceholderText(/enter swimlane name/i);
    await userEvent.type(input, 'New Lane');

    await userEvent.click(screen.getByRole('button', { name: /^add$/i }));

    await waitFor(() => {
      expect(swimlaneApi.createSwimlane).toHaveBeenCalledWith({
        board_id: boardId,
        name: 'New Lane',
        order: 1,
      });
    });

    expect(onChange).toHaveBeenCalled();
  });

  // Note: the Add button is disabled when the name is empty,
  // so the error branch in handleAddSwimlane is not reachable via UI.

  it('edits an existing swimlane', async () => {
    const item = { _id: 's1', name: 'Alpha' };
    (swimlaneApi.fetchSwimlanesByBoard as jest.Mock).mockResolvedValueOnce({ data: [item] });
    (swimlaneApi.updateSwimlane as jest.Mock).mockResolvedValueOnce({ success: true });

    const onChange = jest.fn();
    render(<SwimlaneManager boardId={boardId} onSwimlanesChange={onChange} />);

    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    const editInput = screen.getByDisplayValue('Alpha');
    await userEvent.clear(editInput);
    await userEvent.type(editInput, 'Beta');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(swimlaneApi.updateSwimlane).toHaveBeenCalledWith('s1', { name: 'Beta' });
    });
    expect(onChange).toHaveBeenCalled();
  });

  it('deletes a swimlane after confirm', async () => {
    mockConfirm.mockResolvedValueOnce(true);
    const item = { _id: 's2', name: 'ToDelete' };
    (swimlaneApi.fetchSwimlanesByBoard as jest.Mock).mockResolvedValueOnce({ data: [item] });
    (swimlaneApi.deleteSwimlane as jest.Mock).mockResolvedValueOnce({ success: true });

    const onChange = jest.fn();
    render(<SwimlaneManager boardId={boardId} onSwimlanesChange={onChange} />);

    await waitFor(() => expect(screen.getByText('ToDelete')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(swimlaneApi.deleteSwimlane).toHaveBeenCalledWith('s2');
    });
    expect(onChange).toHaveBeenCalled();
  });
});
