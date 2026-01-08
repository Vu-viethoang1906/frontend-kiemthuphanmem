import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Provide a virtual mock for react-router-dom so we don't load the real ESM
const mockNavigate = jest.fn();
let mockPathname = '/';
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}), { virtual: true });

// Mock useKeycloak hook provider usage inside AppWrapper indirectly via App
jest.mock('@react-keycloak/web', () => ({ useKeycloak: () => ({ initialized: true, keycloak: { token: 'k', authenticated: true, tokenParsed: { sub: 'u1' } } }) }));

// Mock getMe to return roles
jest.mock('../../../api/authApi', () => ({ getMe: jest.fn().mockResolvedValue({ data: { roles: ['user'] } }) }));

// Mock App internals to a minimal router tree
jest.mock('../../../App', () => () => <div>App Shell</div>);

import AppWrapper from '../../../AppWrapper';

describe('AppWrapper basic bootstrapping', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders App without blocking screen', async () => {
    render(<AppWrapper />);
    expect(screen.getByText('App Shell')).toBeInTheDocument();
  });

  it('sets roles in localStorage from getMe response', async () => {
    localStorage.setItem('token', 't');
    mockPathname = '/dashboard';
    render(<AppWrapper />);
    await waitFor(() => expect(JSON.parse(localStorage.getItem('roles') || '[]')).toEqual(['user']));
  });
});
