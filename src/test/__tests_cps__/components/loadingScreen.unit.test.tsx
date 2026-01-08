import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingScreen from '../../../components/LoadingScreen';

describe('LoadingScreen component', () => {
  it('renders with default message', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingScreen message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });
});
