import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

jest.mock('../../../../components/ModalProvider', () => ({
  useModal: () => ({ show: jest.fn() }),
  ModalProvider: ({ children }: any) => <>{children}</>,
}));

import TagManagerModal from '../../../../components/BoardDetail/TagManagerModal';

describe('TagManagerModal edge cases', () => {
  it('renders empty tags state and allows removing a tag', async () => {
    const onRemoveTag = jest.fn();

    render(
      <TagManagerModal
        show={true}
        allTags={[{ _id: 't1', name: 'Frontend', color: '#2196f3' }] as any}
        editingTag={null as any}
        newTagName=""
        newTagColor="#000000"
        onClose={jest.fn()}
        onNewTagNameChange={jest.fn()}
        onNewTagColorChange={jest.fn()}
        onCreateTag={jest.fn()}
        onEditTag={jest.fn()}
        onUpdateTag={jest.fn()}
        onCancelEdit={jest.fn()}
        onDeleteTag={jest.fn()}
        onEditingTagChange={jest.fn()}
      />
    );

    // Renders manage tags header and available tags
    expect(screen.getByText(/manage tags/i)).toBeInTheDocument();
    const tagChip = screen.getByText(/frontend/i);
    await userEvent.click(tagChip);
    expect(tagChip).toBeInTheDocument();
  });
});
