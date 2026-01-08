import React from 'react';
import { render, screen } from '@testing-library/react';
import EditTaskModal from '../../components/BoardDetail/EditTaskModal';
import { ModalProvider } from '../../components/ModalProvider';

// Minimal sanity test to keep legacy file active without skips
describe('EditTaskModal flows (legacy)', () => {
  it('renders with minimal props', async () => {
    render(
      <ModalProvider>
        <EditTaskModal
          show={true}
          editingTask={{ id: 't1', title: 'T', column_id: 'c1' } as any}
          board={{ title: 'B' }}
          columns={[{ id: 'c1', name: 'Todo' }] as any}
          swimlanes={[]}
          allTags={[]}
          taskTags={[]}
          tagSearchInput=""
          selectedTagId=""
          boardMembers={[]}
          onClose={() => {}}
          onTaskChange={() => {}}
          onTagSearchChange={() => {}}
          onTagSelect={() => {}}
          onRemoveTag={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </ModalProvider>
    );
    expect(await screen.findByText(/Task Information/i)).toBeInTheDocument();
  });
});
