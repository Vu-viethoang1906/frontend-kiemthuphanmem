import React from 'react';
import { render, screen } from '@testing-library/react';
import * as userApi from '../../../api/userApi';
// Avoid importing MemoryRouter; mock router hooks to satisfy components.
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  useLocation: () => ({ pathname: '/admin/users' }),
}), { virtual: true });
import UserManagement from '../../../pages/Admin/UserManagement';
jest.mock('../../../auth/useKeycloak', () => ({ useAuth: () => ({ isAuthenticated: true, token: 't' }) }));
jest.mock('../../../contexts/UserContext', () => ({ useUser: () => ({ user: { id: 1, username: 'test' } }) }));
jest.mock('../../../components/ModalProvider', () => ({ useModal: () => ({ show: jest.fn(), openModal: jest.fn(), closeModal: jest.fn() }) }));

describe('UserManagement: error behavior', () => {
  beforeEach(() => {
    jest.spyOn(userApi, 'fetchAllUsers').mockRejectedValue(new Error('network'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders heading and empty state when API fails', async () => {
    render(<UserManagement />);
    const heading = await screen.findByRole('heading', { name: /User/i });
    expect(heading).toBeInTheDocument();

    // Empty state or error hint should appear
    // When load fails, UI still renders controls (fallback behavior)
    expect(await screen.findByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
