import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../../../components/Pagination';

describe('components/Pagination', () => {
  test('does not render when totalPages <= 1', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders page buttons and navigates via arrows', async () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={2} totalPages={4} onPageChange={onPageChange} />);

    // Buttons 1..4 and arrows are present
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Left arrow should go to page 1
    await userEvent.click(screen.getByText('<'));
    expect(onPageChange).toHaveBeenCalledWith(1);

    // Click page 4 directly
    await userEvent.click(screen.getByText('4'));
    expect(onPageChange).toHaveBeenCalledWith(4);

    // Right arrow should go to page 3
    await userEvent.click(screen.getByText('>'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  test('disables arrows at bounds and prevents invalid page changes', async () => {
    const onPageChange = jest.fn();
    const { rerender } = render(<Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />);

    // Left arrow disabled on first page
    const left = screen.getByText('<');
    expect(left).toBeDisabled();
    await userEvent.click(left);
    expect(onPageChange).not.toHaveBeenCalled();

    // Go to last page
    rerender(<Pagination currentPage={3} totalPages={3} onPageChange={onPageChange} />);
    const right = screen.getByText('>');
    expect(right).toBeDisabled();
    await userEvent.click(right);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
