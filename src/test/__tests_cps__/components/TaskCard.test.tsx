import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import TaskCard from '../../../components/BoardDetail/TaskCard';
import { updateTask } from '../../../api/taskApi';
import { uploadFileToTask } from '../../../api/fileApi';

global.HTMLElement.prototype.getBoundingClientRect = function () {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 20,
    top: 0,
    left: 0,
    right: 100,
    bottom: 20,
    toJSON: () => ({}),
  } as DOMRect;
};

jest.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Translate: { toString: () => '' } },
}));

jest.mock('../../../api/taskApi', () => ({
  updateTask: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../../api/fileApi', () => ({
  uploadFileToTask: jest.fn(() => Promise.resolve({})),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('TaskCard', () => {
  const baseTask = {
    _id: 'task1',
    title: 'Sample Task',
    column_id: 'col1',
    swimlane_id: 'sw1',
    tags: [{ _id: 'tag1', name: 'Tag 1', color: '#111111' }],
    due_date: '2000-01-01',
  };

  const baseProps = () => ({
    task: baseTask,
    index: 0,
    columnId: 'col1',
    swimlaneId: 'sw1',
    members: [] as any[],
    reloadTasks: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onReloadEditingTask: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders title, tag, and overdue date', () => {
    const props = baseProps();
    const { container } = render(<TaskCard {...props} />);

    expect(screen.getByText('Sample Task')).toBeInTheDocument();
    expect(screen.getByText('Tag 1')).toHaveStyle('background-color: #111111');

    const due = container.querySelector('.board-card__due-date');
    expect(due?.className).toContain('overdue');
    expect(due?.textContent).toBe('01/01/2000');
  });

  it('calls onEdit when card is clicked', () => {
    const props = baseProps();
    const { container } = render(<TaskCard {...props} />);

    fireEvent.click(container.querySelector('.board-card') as HTMLElement);

    expect(props.onEdit).toHaveBeenCalledWith(expect.objectContaining({ _id: 'task1' }));
  });

  it('triggers hidden file input when upload button is clicked', () => {
    const props = baseProps();
    const clickSpy = jest.spyOn(HTMLInputElement.prototype, 'click');

    render(<TaskCard {...props} />);

    fireEvent.click(screen.getByTitle('Upload file'));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('opens assignee list and assigns a member', async () => {
    jest.useFakeTimers();
    const props = baseProps();
    props.members = [
      {
        user_id: {
          _id: 'u1',
          username: 'user1',
          avatar_url: 'http://example.com/avatar.png',
        },
      },
    ];

    render(<TaskCard {...props} />);

    fireEvent.click(document.querySelector('.assignee-section') as HTMLElement);

    fireEvent.click(await screen.findByText('user1'));

    await act(async () => {
      await Promise.resolve();
      jest.runAllTimers();
    });

    expect(updateTask).toHaveBeenCalledWith('task1', { assigned_to: 'u1' });
    expect(props.reloadTasks).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
