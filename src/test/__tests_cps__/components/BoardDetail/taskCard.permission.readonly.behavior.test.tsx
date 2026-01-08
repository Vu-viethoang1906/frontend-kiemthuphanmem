import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../../../../components/BoardDetail/TaskCard';

describe('TaskCard - read-only permission', () => {
  it('triggers edit when clicking title (baseline interaction)', () => {
    const onEdit = jest.fn();
    const noop = () => {};
    render(
      <TaskCard
        task={{ id: 't1', title: 'Sample Task', description: '', column_id: 'c1' }}
        index={0}
        columnId={'c1'}
        swimlaneId={'s1'}
        members={[]}
        reloadTasks={noop}
        onEdit={onEdit}
        onDelete={noop}
      />
    );

    expect(screen.getByText(/sample task/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/sample task/i));
    expect(onEdit).toHaveBeenCalled();
  });
});
