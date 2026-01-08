import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../../../components/Pagination';

describe('Pagination Component', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all page buttons for small page count', () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render previous and next navigation buttons', () => {
      render(
        <Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveTextContent('<');
      expect(buttons[buttons.length - 1]).toHaveTextContent('>');
    });

    it('should not render when totalPages is 1', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when totalPages is 0', () => {
      const { container } = render(
        <Pagination currentPage={1} totalPages={0} onPageChange={mockOnPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should highlight current page button', () => {
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const currentPageButton = screen.getByText('3');
      expect(currentPageButton).toHaveClass('active');
    });
  });

  describe('User Interactions', () => {
    it('should call onPageChange when a page number is clicked', () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const pageThreeButton = screen.getByText('3');
      userEvent.click(pageThreeButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
      expect(mockOnPageChange).toHaveBeenCalledTimes(1);
    });

    it('should call onPageChange when next button is clicked', () => {
      render(
        <Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[buttons.length - 1];
      userEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should call onPageChange when previous button is clicked', () => {
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons[0];
      userEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should not call onPageChange when clicking current page', () => {
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const currentPageButton = screen.getByText('3');
      userEvent.click(currentPageButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Boundary Conditions', () => {
    it('should disable previous button on first page', () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons[0];
      
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      render(
        <Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[buttons.length - 1];
      
      expect(nextButton).toBeDisabled();
    });

    it('should not call onPageChange when clicking disabled previous button', () => {
      render(
        <Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons[0];
      userEvent.click(prevButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should not call onPageChange when clicking disabled next button', () => {
      render(
        <Pagination currentPage={5} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[buttons.length - 1];
      userEvent.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should enable previous button when not on first page', () => {
      render(
        <Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const prevButton = buttons[0];
      
      expect(prevButton).not.toBeDisabled();
    });

    it('should enable next button when not on last page', () => {
      render(
        <Pagination currentPage={4} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[buttons.length - 1];
      
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle large page numbers correctly', () => {
      render(
        <Pagination currentPage={50} totalPages={100} onPageChange={mockOnPageChange} />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should navigate correctly from middle page', () => {
      render(
        <Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      const nextButton = buttons[buttons.length - 1];
      userEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(6);

      const prevButton = buttons[0];
      userEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(4);
    });

    it('should render correctly with only 2 pages', () => {
      render(
        <Pagination currentPage={1} totalPages={2} onPageChange={mockOnPageChange} />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // prev, page 1, page 2, next
    });

    it('should allow clicking any page number to jump directly', () => {
      render(
        <Pagination currentPage={1} totalPages={10} onPageChange={mockOnPageChange} />
      );

      const page7Button = screen.getByText('7');
      userEvent.click(page7Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(7);
    });
  });

  describe('Visual States', () => {
    it('should apply active class only to current page', () => {
      render(
        <Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const page1 = screen.getByText('1');
      const page2 = screen.getByText('2');
      const page3 = screen.getByText('3');
      const page4 = screen.getByText('4');
      const page5 = screen.getByText('5');

      expect(page3).toHaveClass('active');
      expect(page1).not.toHaveClass('active');
      expect(page2).not.toHaveClass('active');
      expect(page4).not.toHaveClass('active');
      expect(page5).not.toHaveClass('active');
    });

    it('should maintain proper button classes', () => {
      render(
        <Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('pagination-btn');
      });
    });
  });
});
