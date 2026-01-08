import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentationModal from '../../../components/DocumentationModal';

describe('DocumentationModal', () => {
  it('renders and can be closed by clicking backdrop or close button', () => {
    const onClose = jest.fn();
    render(<DocumentationModal onClose={onClose} />);
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    // click the close button
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });
});
