import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginForm from '../../../components/LoginForm';

describe('LoginForm', () => {
  it('renders inputs and button', () => {
    render(<LoginForm />);
  // Title heading
  expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });
});
