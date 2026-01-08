import React from 'react';
import { render, screen } from '@testing-library/react';
import { CustomToast, showErrorToast, showInfoToast, showSuccessToast, showWarningToast } from '../../../components/CustomToast';

describe('CustomToast component', () => {
  it('renders title and optional message', () => {
    render(<CustomToast title="Hello" message="World" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('renders via helpers for different types', () => {
    const { rerender } = render(showSuccessToast('Success', 'ok'));
    expect(screen.getByText('Success')).toBeInTheDocument();
    rerender(showErrorToast('Error', 'bad'));
    expect(screen.getByText('Error')).toBeInTheDocument();
    rerender(showWarningToast('Warn', 'care'));
    expect(screen.getByText('Warn')).toBeInTheDocument();
    rerender(showInfoToast('Info', 'note'));
    expect(screen.getByText('Info')).toBeInTheDocument();
  });
});
