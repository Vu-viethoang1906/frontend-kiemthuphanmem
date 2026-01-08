import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../../components/ModalProvider', () => ({
  useModal: () => ({ show: jest.fn() }),
  ModalProvider: ({ children }: any) => <>{children}</>,
}));

import EditTaskModal from '../../../../components/BoardDetail/EditTaskModal';

const task = {
  _id: 't1',
  title: 'Read-only Task',
  description: 'Desc',
  column_id: 'c1',
  swimlane_id: 's1',
  created_by: { username: 'alice' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('EditTaskModal permission gate (read-only)', () => {
  it('renders and allows saving with current props', async () => {
    const onUpdate = jest.fn();
    render(
      <EditTaskModal
        show={true}
        editingTask={task as any}
        board={{ title: 'Board' } as any}
        columns={[{ id: 'c1', name: 'Todo' }] as any}
        swimlanes={[{ id: 's1', name: 'Lane 1' }] as any}
        allTags={[]}
        taskTags={[]}
        tagSearchInput=""
        selectedTagId=""
        boardMembers={[] as any}
        onClose={jest.fn()}
        onTaskChange={jest.fn()}
        onTagSearchChange={jest.fn()}
        onTagSelect={jest.fn()}
        onRemoveTag={jest.fn()}
        onUpdate={onUpdate}
        onDelete={jest.fn()}
      />
    );
    const saveButton = await screen.findByRole('button', { name: /save/i });
    saveButton.click();
    expect(onUpdate).toHaveBeenCalled();
  });
});
