import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('../../../../components/ModalProvider', () => ({
  useModal: () => ({ show: jest.fn(), confirm: jest.fn() }),
  ModalProvider: ({ children }: any) => <>{children}</>,
}));

import CreateTaskModal from '../../../../components/BoardDetail/CreateTaskModal';

describe('CreateTaskModal cancel flow', () => {
  it('does not call onCreate when user cancels', async () => {
    const baseTask = {
      title: '',
      description: '',
      column_id: '',
      swimlane_id: '',
      priority: '',
      estimate_hours: undefined,
      start_date: '',
      due_date: '',
      nameTag: '',
    };
    const onCreate = jest.fn();
    const onClose = jest.fn();
    const onTaskChange = jest.fn();
    render(
      <CreateTaskModal
        show={true}
        newTask={baseTask as any}
        allTags={[]}
        newTaskTagSearch=""
        newTaskSelectedTagId=""
        onClose={onClose}
        onTaskChange={onTaskChange}
        onTagSearchChange={jest.fn()}
        onTagSelect={jest.fn()}
        onCreate={onCreate}
      />
    );

    const titleInput = await screen.findByPlaceholderText(/enter task title/i);
    await userEvent.type(titleInput, 'New Task');
    expect(onTaskChange).toHaveBeenCalled();

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelBtn);

    expect(onCreate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
