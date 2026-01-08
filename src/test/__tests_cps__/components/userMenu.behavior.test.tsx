import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from '../../../components/UserMenu';

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true },
);

describe('components/UserMenu', () => {
  const baseProps = {
    avatarUrl: 'https://example.com/avatar.png',
    email: 'user@example.com',
    displayName: 'Test User',
    onLogout: jest.fn(),
  };

  test('toggles open/close and shows content', async () => {
    render(<UserMenu {...baseProps} />);

    // Menu closed initially
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();

    // Open menu via avatar button
    const avatarBtn = screen.getByRole('button', { expanded: false });
    await userEvent.click(avatarBtn);
    expect(screen.getByText('Log out')).toBeInTheDocument();
    expect(screen.getByText('Manage account')).toBeInTheDocument();

    // Close via close button
    const close = screen.getByRole('button', { name: 'Close' });
    await userEvent.click(close);
    expect(screen.queryByText('Log out')).not.toBeInTheDocument();
  });

  test('logout button invokes callback', async () => {
    const onLogout = jest.fn();
    render(<UserMenu {...baseProps} onLogout={onLogout} />);

    // Open menu then click logout
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    const logoutBtn = screen.getByRole('button', { name: /Log out/i });
    await userEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  test('theme preview switch toggles aria-checked', async () => {
    render(<UserMenu {...baseProps} />);
    await userEvent.click(screen.getByRole('button', { expanded: false }));

    const themeSwitch = screen.getByRole('switch');
    expect(themeSwitch).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(themeSwitch);
    expect(themeSwitch).toHaveAttribute('aria-checked', 'true');
  });
});
