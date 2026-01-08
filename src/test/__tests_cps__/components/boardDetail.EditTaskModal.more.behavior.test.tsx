import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../../../components/ModalProvider', () => ({
  useModal: () => ({ show: jest.fn(), confirm: jest.fn() }),
  ModalProvider: ({ children }: any) => <>{children}</>,
}));

import EditTaskModal from '../../../components/BoardDetail/EditTaskModal';

const makeTask = () => ({
  _id: 't-more',
  title: 'More Test Task',
  description: 'Extended',
  column_id: 'c1',
  swimlane_id: 's1',
  created_by: { username: 'creator' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const baseProps: React.ComponentProps<typeof EditTaskModal> = {
  show: true,
  editingTask: makeTask(),
  board: { title: 'Board Extended' },
  columns: [{ id: 'c1', name: 'Todo' }],
  swimlanes: [{ id: 's1', name: 'Lane 1' }],
  allTags: [ { _id: 'tag1', name: 'Frontend', color: '#2196f3' } ],
  taskTags: [ { _id: 'tag1', name: 'Frontend', color: '#2196f3' } ],
  tagSearchInput: '',
  selectedTagId: '',
  boardMembers: [ { user_id: { _id: 'u1', username: 'alice', full_name: 'Alice' } } ],
  onClose: jest.fn(),
  onTaskChange: jest.fn(),
  onTagSearchChange: jest.fn(),
  onTagSelect: jest.fn(),
  onRemoveTag: jest.fn(),
  onUpdate: jest.fn(),
  onDelete: jest.fn(),
};

describe('EditTaskModal MORE behavior', () => {
  it('renders extended fields (priority, estimate hours input)', () => {
    render(<EditTaskModal {...baseProps} />);
    // Priority select is second select
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
    // Estimate hours input placeholder
    expect(screen.getByPlaceholderText(/0.0/i)).toBeInTheDocument();
    // Tag area
    expect(screen.getByText(/selected tags/i)).toBeInTheDocument();
  });
});
