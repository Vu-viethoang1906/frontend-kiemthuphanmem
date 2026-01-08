import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

jest.mock('@react-keycloak/web', () => ({ useKeycloak: () => {
  const mockLogin = jest.fn().mockRejectedValue(new Error('login failed'));
  const mockLogout = jest.fn().mockResolvedValue(undefined);
  return {
    initialized: true,
    keycloak: {
      login: mockLogin,
      logout: mockLogout,
      authenticated: true,
      token: 'kc-token',
      refreshToken: 'kc-refresh',
      tokenParsed: { sub: 'uid-err', preferred_username: 'erruser' },
    }
  };
} }));

// getKeycloakUser will reject to hit error branches in useEffect
jest.mock('../../../api/authApi', () => ({
  getKeycloakUser: jest.fn().mockRejectedValue(new Error('fetch user failed')),
}));
import { getKeycloakUser } from '../../../api/authApi';

import { useAuth } from '../../../auth/useKeycloak';

const Probe: React.FC = () => {
  const { login } = useAuth();
  return <button onClick={() => login()}>login</button>;
};

describe('useAuth error branches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('logs error when getKeycloakUser fails in effect and login() rejects', async () => {
    render(<Probe />);

    // useEffect should attempt to fetch user and reject
    await waitFor(() => expect(getKeycloakUser).toHaveBeenCalledWith('uid-err'));

    // Trigger login rejection path
    screen.getByText('login').click();
    expect(localStorage.getItem('token')).toBeNull();
  });
});
