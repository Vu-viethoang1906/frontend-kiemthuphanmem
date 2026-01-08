import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../../components/ModalProvider', () => ({
  useModal: () => ({ show: jest.fn(), confirm: jest.fn() }),
  ModalProvider: ({ children }: any) => <>{children}</>,
}));

import EditTaskModal from '../../../../components/BoardDetail/EditTaskModal';

const makeTask = () => ({
  _id: 't-inline',
  title: 'Inline Behavior',
  description: 'Desc',
  column_id: 'c1',
  swimlane_id: 's1',
});

describe('BoardDetail/editTaskModal.behavior', () => {
  it('renders title input and buttons', () => {
    render(<EditTaskModal show editingTask={makeTask()} board={{}} columns={[]} swimlanes={[]} allTags={[]} taskTags={[]} tagSearchInput="" selectedTagId="" boardMembers={[]} onClose={jest.fn()} onTaskChange={jest.fn()} onTagSearchChange={jest.fn()} onTagSelect={jest.fn()} onRemoveTag={jest.fn()} onUpdate={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByPlaceholderText(/enter task title/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeTruthy();
  });
});
