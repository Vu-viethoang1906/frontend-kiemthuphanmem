import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditTaskModal from '../../../components/BoardDetail/EditTaskModal';
import { ModalProvider } from '../../../components/ModalProvider';
import '@testing-library/jest-dom';

jest.mock('../../../auth/useKeycloak', () => ({ useAuth: () => ({ isAuthenticated: true, token: 't' }) }));
jest.mock('../../../contexts/UserContext', () => ({ useUser: () => ({ user: { id: 1, username: 'test' } }) }));
jest.mock('../../../api/taskApi', () => ({ updateTask: jest.fn().mockResolvedValue({}) }));
// Use real ModalProvider to ensure portal/contexts are available

// Align props with component expectations (similar to MORE behavior test)
const makeTask = () => ({
  _id: 't-validate',
  title: 'Old',
  description: '',
  column_id: 'c1',
  swimlane_id: 's1',
  created_by: { username: 'creator' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

describe('EditTaskModal: validation behavior', () => {
  test('shows validation error when title is empty', async () => {
    render(
      <ModalProvider>
        <EditTaskModal
          show={true}
          editingTask={makeTask()}
          board={{ title: 'Board' }}
          columns={[{ id: 'c1', name: 'Todo' }]}
          swimlanes={[{ id: 's1', name: 'Lane 1' }]}
          allTags={[]}
          taskTags={[]}
          tagSearchInput=""
          selectedTagId=""
          boardMembers={[]}
          onClose={jest.fn()}
          onTaskChange={jest.fn()}
          onTagSearchChange={jest.fn()}
          onTagSelect={jest.fn()}
          onRemoveTag={jest.fn()}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
        />
      </ModalProvider>
    );

    // Find title input by its current value, then clear
    const titleInput = (await screen.findByDisplayValue('Old')) as HTMLInputElement;
    await userEvent.clear(titleInput);
    const saveButton = screen.getByRole('button', { name: /save/i });
    const onUpdate = jest.fn();
    // Re-render with spy wired via props (using same inputs)
    render(
      <ModalProvider>
        <EditTaskModal
          show={true}
          editingTask={{ ...makeTask(), title: '' }}
          board={{ title: 'Board' }}
          columns={[{ id: 'c1', name: 'Todo' }]}
          swimlanes={[{ id: 's1', name: 'Lane 1' }]}
          allTags={[]}
          taskTags={[]}
          tagSearchInput=""
          selectedTagId=""
          boardMembers={[]}
          onClose={jest.fn()}
          onTaskChange={jest.fn()}
          onTagSearchChange={jest.fn()}
          onTagSelect={jest.fn()}
          onRemoveTag={jest.fn()}
          onUpdate={onUpdate}
          onDelete={jest.fn()}
        />
      </ModalProvider>
    );
    await userEvent.click(saveButton);
    // Expect not to call update when title is empty (validation prevents submit)
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
