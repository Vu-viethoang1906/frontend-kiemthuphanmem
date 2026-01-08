import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SupportCenter from '../../../components/SupportCenter';

describe('SupportCenter component', () => {
  it('renders header and images, and triggers onClose', () => {
    const onClose = jest.fn();
    render(<SupportCenter onClose={onClose} />);

    // Header
    expect(screen.getByText('Support Center')).toBeInTheDocument();

    // 3 images from supportCards
    const imgs = screen.getAllByRole('img');
    expect(imgs.length).toBe(3);

    // Close button exists and works
    const closeBtn = screen.getByRole('button');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
