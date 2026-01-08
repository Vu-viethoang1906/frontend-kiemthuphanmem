import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Filters page renders content', () => {
  it('shows heading and placeholder text', () => {
  const { default: Filters } = require('../../../pages/Filters/Filters');
    render(<Filters />);
    expect(screen.getByRole('heading', { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
