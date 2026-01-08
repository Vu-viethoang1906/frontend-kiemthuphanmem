import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TagManagerModal from '../../../components/BoardDetail/TagManagerModal';

describe('TagManagerModal', () => {
  const baseHandlers = () => ({
    onClose: jest.fn(),
    onNewTagNameChange: jest.fn(),
    onNewTagColorChange: jest.fn(),
    onCreateTag: jest.fn(),
    onEditTag: jest.fn(),
    onUpdateTag: jest.fn(),
    onCancelEdit: jest.fn(),
    onDeleteTag: jest.fn(),
    onEditingTagChange: jest.fn(),
  });

  const renderModal = (overrideProps: Partial<React.ComponentProps<typeof TagManagerModal>> = {}) => {
    const handlers = baseHandlers();
    const props: React.ComponentProps<typeof TagManagerModal> = {
      show: true,
      allTags: [],
      editingTag: null,
      newTagName: '',
      newTagColor: '#123456',
      ...handlers,
      ...overrideProps,
    } as React.ComponentProps<typeof TagManagerModal>;

    return { ...handlers, ...render(<TagManagerModal {...props} />), props };
  };

  it('does not render when show is false', () => {
    const { container } = render(
      <TagManagerModal
        show={false}
        allTags={[]}
        editingTag={null}
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

    expect(container.firstChild).toBeNull();
  });

  it('shows empty state and triggers create flow', () => {
    const handlers = baseHandlers();
    const { rerender } = render(
      <TagManagerModal
        show
        allTags={[]}
        editingTag={null}
        newTagName=""
        newTagColor="#abcdef"
        {...handlers}
      />
    );

    expect(screen.getByText(/No tags yet/i)).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('Enter tag name');
    fireEvent.change(nameInput, { target: { value: 'New Tag' } });
    expect(handlers.onNewTagNameChange).toHaveBeenCalledWith('New Tag');

    rerender(
      <TagManagerModal
        show
        allTags={[]}
        editingTag={null}
        newTagName="New Tag"
        newTagColor="#abcdef"
        {...handlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Create/i }));
    expect(handlers.onCreateTag).toHaveBeenCalled();
  });

  it('renders tags and handles edit and delete actions', () => {
    const handlers = baseHandlers();
    const tag = { id: 't1', name: 'Tag 1', color: '#111111' };

    render(
      <TagManagerModal
        show
        allTags={[tag]}
        editingTag={null}
        newTagName=""
        newTagColor="#123456"
        {...handlers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
    expect(handlers.onEditTag).toHaveBeenCalledWith(expect.objectContaining(tag));

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }));
    expect(handlers.onDeleteTag).toHaveBeenCalledWith('t1');
  });

  it('renders editing state and handles updates', () => {
    const handlers = baseHandlers();
    const editingTag = { id: 't2', name: 'Editing', color: '#222222' };

    render(
      <TagManagerModal
        show
        allTags={[editingTag]}
        editingTag={editingTag}
        newTagName=""
        newTagColor="#123456"
        {...handlers}
      />
    );

    const editNameInput = screen.getByDisplayValue('Editing');
    fireEvent.change(editNameInput, { target: { value: 'Updated' } });
    expect(handlers.onEditingTagChange).toHaveBeenCalledWith({ ...editingTag, name: 'Updated' });

    const colorInput = screen.getByLabelText('Editing tag color');
    fireEvent.change(colorInput, { target: { value: '#ffffff' } });
    expect(handlers.onEditingTagChange).toHaveBeenCalledWith({ ...editingTag, color: '#ffffff' });

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));
    expect(handlers.onUpdateTag).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(handlers.onCancelEdit).toHaveBeenCalled();
  });

  it('closes when clicking the overlay', () => {
    const handlers = baseHandlers();
    const { container } = render(
      <TagManagerModal
        show
        allTags={[]}
        editingTag={null}
        newTagName=""
        newTagColor="#abcdef"
        {...handlers}
      />
    );

    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(handlers.onClose).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Manage Tags/i));
    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });
});
