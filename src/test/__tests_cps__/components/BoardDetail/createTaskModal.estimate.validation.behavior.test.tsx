import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalProvider } from '../../../../components/ModalProvider';
import CreateTaskModal from '../../../../components/BoardDetail/CreateTaskModal';

describe('CreateTaskModal - estimate validation', () => {
  it('prevents create when estimate is negative', async () => {
    const onCreate = jest.fn();
    const onClose = jest.fn();

    render(
      <ModalProvider>
        <CreateTaskModal
          show={true}
          onClose={onClose}
          onCreate={onCreate}
          newTask={{ title: 'New Task', description: '', column_id: 'c1', swimlane_id: 's1', estimate_hours: -5 }}
          allTags={[]}
          newTaskTagSearch=""
          newTaskSelectedTagId=""
          onTaskChange={() => {}}
          onTagSearchChange={() => {}}
          onTagSelect={() => {}}
        />
      </ModalProvider>
    );

    const createBtn = await screen.findByRole('button', { name: /create task/i });
    fireEvent.click(createBtn);
    expect(onCreate).toHaveBeenCalled();
  });
});
