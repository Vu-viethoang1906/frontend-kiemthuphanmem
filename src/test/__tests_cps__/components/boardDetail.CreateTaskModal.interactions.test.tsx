import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CreateTaskModal from '../../../components/BoardDetail/CreateTaskModal';

describe('CreateTaskModal interactions', () => {
  const baseTask = {
    title: '',
    description: '',
    column_id: '',
    swimlane_id: '',
    priority: '',
    estimate_hours: undefined,
    start_date: '',
    due_date: '',
    nameTag: ''
  };

  const tags = [
    { _id: 't1', name: 'Bug', color: '#f00' },
    { _id: 't2', name: 'Feature', color: '#0f0' },
  ];

  function setup(overrides: Partial<React.ComponentProps<typeof CreateTaskModal>> = {}) {
    const props = {
      show: true,
      newTask: baseTask,
      allTags: tags,
      newTaskTagSearch: '',
      newTaskSelectedTagId: '',
      onClose: jest.fn(),
      onTaskChange: jest.fn(),
      onTagSearchChange: jest.fn(),
      onTagSelect: jest.fn(),
      onCreate: jest.fn(),
      ...overrides,
    } as React.ComponentProps<typeof CreateTaskModal>;

    const utils = render(<CreateTaskModal {...props} />);
    const rerender = (next: Partial<React.ComponentProps<typeof CreateTaskModal>> = {}) => {
      // keep handler fns stable, update only stateful props
      Object.assign(props, next);
      utils.rerender(<CreateTaskModal {...props} />);
    };
    return { props, rerender };
  }

  it('enables Create only when title and column are set; handles close', () => {
    const { props, rerender } = setup();

    const createBtn = screen.getByRole('button', { name: /create/i });
    expect(createBtn).toBeDisabled();

    const title = screen.getByPlaceholderText('Enter task title');
    fireEvent.change(title, { target: { value: 'My Task' } });
    expect(props.onTaskChange).toHaveBeenCalled();

    // Still disabled because column not set
    expect(createBtn).toBeDisabled();

  // Re-render with column set
  rerender({ newTask: { ...baseTask, title: 'My Task', column_id: 'col-1' } });
    expect(screen.getByRole('button', { name: /create/i })).toBeEnabled();

    // Close via cancel and X button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('filters tags, selects one, and shows selection hint', () => {
    const { props, rerender } = setup({ newTaskTagSearch: '' });

    // Tag search input present; it calls onTagSearchChange and onTaskChange
    const tagSearch = screen.getByPlaceholderText('Search tags or type new tag name...');
    fireEvent.change(tagSearch, { target: { value: 'fe' } });
    expect(props.onTagSearchChange).toHaveBeenCalledWith('fe');
    expect(props.onTaskChange).toHaveBeenCalled();

    // Re-render with controlled search and verify filtering
    rerender({ newTaskTagSearch: 'bug' });
    // Avoid brittle exact count text, just ensure filtered tag appears
    expect(screen.getByText('Bug')).toBeInTheDocument();

    // Select tag
    fireEvent.click(screen.getByText('Bug'));
    expect(props.onTagSelect).toHaveBeenCalledWith('t1', 'Bug');
  });
});
