import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../../../components/Pagination';

describe('Pagination component', () => {
  it('does not render when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders pages and handles page clicks', () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);

    // Should render 5 numbered buttons plus prev/next
    const buttons = screen.getAllByRole('button');
    // 5 pages + 2 arrows
    expect(buttons.length).toBe(7);

    // Click a numbered page (3)
    fireEvent.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    // Click prev arrow should go to 1
    fireEvent.click(screen.getByRole('button', { name: '<' }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    // Click next arrow should go to 3
    fireEvent.click(screen.getByRole('button', { name: '>' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables prev on first page and next on last page', () => {
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} onPageChange={jest.fn()} />
    );
    expect(screen.getByRole('button', { name: '<' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '>' })).not.toBeDisabled();

    rerender(<Pagination currentPage={3} totalPages={3} onPageChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: '>' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '<' })).not.toBeDisabled();
  });
});
