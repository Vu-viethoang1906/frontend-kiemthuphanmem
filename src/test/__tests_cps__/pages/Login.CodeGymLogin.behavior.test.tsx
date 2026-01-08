import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

describe('CodeGymLogin behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const setup = async () => {
  const { default: CodeGymLogin } = await import('../../../pages/Login/CodeGymLogin');
    return render(<CodeGymLogin />);
  };

  it('logs in with hardcoded creds and navigates to /dashboard', async () => {
    await setup();
  await userEvent.type(screen.getByPlaceholderText(/username/i), 'user@codegym.vn');
  await userEvent.type(screen.getByPlaceholderText(/password/i), '123456');
  await userEvent.click(screen.getByRole('button', { name: /^Login$/i }));
    expect(localStorage.getItem('token')).toBe('fake-codegym-token-abc123');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates back to /login on back button', async () => {
    await setup();
  await userEvent.click(screen.getByRole('button', { name: /^Back to Regular Login$/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
