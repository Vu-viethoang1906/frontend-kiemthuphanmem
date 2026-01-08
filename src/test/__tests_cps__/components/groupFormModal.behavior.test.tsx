import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GroupFormModal from '../../../components/Group/GroupFormModal';

const baseForm = { name: 'Alpha', description: 'First group' };

const setup = (override: Partial<React.ComponentProps<typeof GroupFormModal>> = {}) => {
  const onSubmit = jest.fn((e: React.FormEvent) => e.preventDefault());
  const onClose = jest.fn();
  const onChange = jest.fn();
  const props: React.ComponentProps<typeof GroupFormModal> = {
    show: true,
    editingGroup: null,
    form: baseForm,
    onSubmit,
    onClose,
    onChange,
    ...override
  };
  const utils = render(<GroupFormModal {...props} />);
  return { ...utils, onSubmit, onClose, onChange };
};

describe('GroupFormModal behavior', () => {
  it('does not render when show=false', () => {
    const { queryByRole } = render(
      <GroupFormModal show={false} editingGroup={null} form={baseForm} onSubmit={jest.fn()} onClose={jest.fn()} onChange={jest.fn()} />
    );
    expect(queryByRole('dialog')).toBeNull();
  });

  it('renders create header when editingGroup is null', () => {
    setup();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create group/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create group/i })).toBeInTheDocument();
  });

  it('renders edit header and button text when editingGroup provided', () => {
    setup({ editingGroup: { id: 'g1', name: 'Alpha' } });
    expect(screen.getByText(/edit group/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('calls onChange for name and description inputs', async () => {
    const { onChange } = setup();
    const nameInput = screen.getByPlaceholderText(/enter group name/i);
    const descInput = screen.getByPlaceholderText(/enter description/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Beta');
    await userEvent.type(descInput, 'Updated');
    expect(onChange).toHaveBeenCalled();
    // Ensure it was called for both fields (value string not strictly asserted due to controlled input)
    expect(onChange).toHaveBeenCalledWith('name', expect.any(String));
    expect(onChange).toHaveBeenCalledWith('description', expect.any(String));
  });

  it('submits form and invokes onSubmit', async () => {
    const { onSubmit } = setup();
    await userEvent.click(screen.getByRole('button', { name: /create group/i }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('closes via Cancel button', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes via header close × button', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when clicking backdrop outside the form', async () => {
    const { onClose } = setup();
    // backdrop is the dialog itself container; clicking its background region triggers onClose
    const dialog = screen.getByRole('dialog');
    await userEvent.click(dialog); // click outside inner form (stopPropagation inside form prevents close)
    expect(onClose).toHaveBeenCalled();
  });
});
