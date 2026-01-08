import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GuideModal from '../../../components/HelpButton/GuideModal';

describe('components/HelpButton/GuideModal render', () => {
  it('renders first page content when open', () => {
    render(<GuideModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/KEN Project Management/i)).toBeInTheDocument();
  });

  it('navigates pages using next and prev and dots; closes on overlay click', () => {
    const onClose = jest.fn();
    render(<GuideModal isOpen={true} onClose={onClose} />);

    // next to page 2
    const nextBtn = screen.getByRole('button', { name: /Next Page/i });
    fireEvent.click(nextBtn);
    expect(screen.getAllByText(/Groups Management|Working with Groups/i).length).toBeGreaterThan(0);

    // jump to page 3 using dots (there are 4 dots total; index-based via title)
    const page3Dot = screen.getByTitle('Page 3');
    fireEvent.click(page3Dot);
    expect(screen.getByText(/Working with the Task Board/i)).toBeInTheDocument();

    // prev back to page 2
    const prevBtn = screen.getByRole('button', { name: /Previous Page/i });
    fireEvent.click(prevBtn);
    expect(screen.getAllByText(/Groups Management|Working with Groups/i).length).toBeGreaterThan(0);

    // close by clicking overlay (container has overlay role via class; click outermost div by text parent traversal)
    const overlay = screen.getAllByText(/Groups Management|Working with Groups/i)[0].closest('.guide-modal-overlay') as HTMLElement | null;
    // fallback: click modal overlay by querying document
    const overlayEl = overlay ?? document.querySelector('.guide-modal-overlay');
    expect(overlayEl).toBeTruthy();
    fireEvent.click(overlayEl as Element);
    expect(onClose).toHaveBeenCalled();
  });

  it('carousel controls change images and indicators', () => {
    render(<GuideModal isOpen={true} onClose={jest.fn()} />);

    // on first page, has left/right carousel buttons
    const leftBtns = document.querySelectorAll('.carousel-btn-prev');
    const rightBtns = document.querySelectorAll('.carousel-btn-next');
    expect(rightBtns.length).toBeGreaterThan(0);

    // click right moves indicator active index (simulate by clicking indicator 2)
    const indicator2 = document.querySelectorAll('.carousel-indicator')[1] as HTMLElement;
    indicator2 && fireEvent.click(indicator2);
    expect(indicator2.classList.contains('active')).toBe(true);
  });

  it('disables prev on first page and next on last page', () => {
    render(<GuideModal isOpen={true} onClose={jest.fn()} />);

    const prevBtn = screen.getByRole('button', { name: /Previous Page/i });
    expect(prevBtn).toBeDisabled();

    let nextBtn = screen.getByRole('button', { name: /Next Page/i }) as HTMLButtonElement;
    // click through pages until disabled (guard with max iterations)
    for (let i = 0; i < 10 && !nextBtn.disabled; i++) {
      fireEvent.click(nextBtn);
      nextBtn = screen.getByRole('button', { name: /Next Page/i }) as HTMLButtonElement;
    }
    expect(nextBtn).toBeDisabled();
  });
});
