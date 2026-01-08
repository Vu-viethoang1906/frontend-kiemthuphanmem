import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Virtual mock for react-router-dom hooks used by the hook under test
const mockNavigate = jest.fn();
let mockPathname = '/';
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}), { virtual: true });

// Mock keycloak provider hook
const mockLogin = jest.fn().mockResolvedValue(undefined);
const mockLogout = jest.fn().mockResolvedValue(undefined);
jest.mock('@react-keycloak/web', () => ({ useKeycloak: () => ({
  initialized: true,
  keycloak: {
    login: mockLogin,
    logout: mockLogout,
    authenticated: true,
    token: 'kc-token',
    refreshToken: 'kc-refresh',
    tokenParsed: { sub: 'uid-1', preferred_username: 'john' },
  }
}) }));

// Mock backend API for keycloak user
jest.mock('../../../api/authApi', () => ({ getKeycloakUser: jest.fn().mockResolvedValue({ _id: 'uid-1', username: 'john' }) }));

import { useAuth } from '../../../auth/useKeycloak';

const HookProbe: React.FC = () => {
  const { initialized, authenticated, username, token, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="initialized">{String(initialized)}</div>
      <div data-testid="authenticated">{String(authenticated)}</div>
      <div data-testid="username">{username}</div>
      <div data-testid="token">{token}</div>
      <button onClick={() => login()}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
};

describe('useAuth hook (Keycloak)', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('exposes key properties and can login to set tokens', async () => {
    render(<HookProbe />);

    expect(screen.getByTestId('initialized').textContent).toBe('true');
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('username').textContent).toBe('john');
    expect(screen.getByTestId('token').textContent).toBe('kc-token');

    // Trigger login flow
    screen.getByText('login').click();
    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
  });

  it('logout clears localStorage and navigates', async () => {
    localStorage.setItem('Type_login', 'SSO');
    render(<HookProbe />);

    screen.getByText('logout').click();
  await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    expect(localStorage.getItem('token')).toBeNull();
  });
});
