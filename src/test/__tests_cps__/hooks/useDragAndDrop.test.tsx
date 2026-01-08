import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useDragAndDrop } from '../../../hooks/useDragAndDrop';

jest.mock('../../../api/taskApi', () => ({
  moveTaskApi: jest.fn().mockResolvedValue({ data: {} }),
}));

const Harness: React.FC<{ onMoved?: () => void }> = ({ onMoved }) => {
  const {
    draggedTask,
    mousePos,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragOver,
  } = useDragAndDrop(onMoved);

  return (
    <div>
      <div data-testid="dragged">{draggedTask?.taskId ?? 'none'}</div>
      <div data-testid="pos">{mousePos.x},{mousePos.y}</div>
      <button onClick={() => handleDragStart('t1', 'c1', 's1')}>start</button>
      <button onClick={() => handleDragEnd()}>end</button>
      <button onClick={() => handleDrop('c2', 'default', 'p1', 'n1')}>drop-ok</button>
      <button onClick={() => handleDrop('c3', 'sw3')}>drop-no-neigh</button>
      <button
        onClick={() => {
          const evt: any = { preventDefault: jest.fn() };
          handleDragOver(evt);
          (window as any).__preventCalls = evt.preventDefault.mock.calls.length;
        }}
      >
        over
      </button>
    </div>
  );
};

describe('hooks/useDragAndDrop', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up marker used for over test
    delete (window as any).__preventCalls;
  });

  it('starts dragging, updates mouse position on move, and ends on mouseup', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('start'));
    expect(screen.getByTestId('dragged').textContent).toBe('t1');

    // simulate mouse move
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 80 }));
    await waitFor(() => expect(screen.getByTestId('pos').textContent).toBe('120,80'));

    // simulate mouse up => drag ends
    window.dispatchEvent(new MouseEvent('mouseup'));
    await waitFor(() => expect(screen.getByTestId('dragged').textContent).toBe('none'));
  });

  it('drop calls moveTaskApi and onMoved; converts default swimlane to undefined', async () => {
    const onMoved = jest.fn();
    render(<Harness onMoved={onMoved} />);
  const { moveTaskApi } = require('../../../api/taskApi');

    // start drag first
    fireEvent.click(screen.getByText('start'));
    fireEvent.click(screen.getByText('drop-ok'));

    await waitFor(() => expect(moveTaskApi).toHaveBeenCalled());
    const call = (moveTaskApi as jest.Mock).mock.calls[0];
    expect(call[0]).toBe('t1');
    expect(call[1]).toMatchObject({
      new_column_id: 'c2',
      new_swimlane_id: undefined,
      prev_task_id: 'p1',
      next_task_id: 'n1',
    });
    expect(onMoved).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('dragged').textContent).toBe('none'));
  });

  it('drop without active drag does nothing', async () => {
    render(<Harness />);
  const { moveTaskApi } = require('../../../api/taskApi');
    fireEvent.click(screen.getByText('drop-no-neigh'));
    await waitFor(() => expect(moveTaskApi).not.toHaveBeenCalled());
  });

  it('drop handles error and resets draggedTask', async () => {
  const { moveTaskApi } = require('../../../api/taskApi');
    (moveTaskApi as jest.Mock).mockRejectedValueOnce(new Error('network oops'));
    render(<Harness />);
    fireEvent.click(screen.getByText('start'));
    fireEvent.click(screen.getByText('drop-no-neigh'));

    await waitFor(() => expect(moveTaskApi).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('dragged').textContent).toBe('none'));
  });

  it('handleDragOver prevents default', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('over'));
    expect((window as any).__preventCalls).toBeGreaterThan(0);
  });
});
