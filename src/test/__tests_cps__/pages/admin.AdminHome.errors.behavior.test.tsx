import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as userApi from '../../../api/userApi';
import * as boardApi from '../../../api/boardApi';
import * as taskApi from '../../../api/taskApi';
import * as groupApi from '../../../api/groupApi';
import * as deploymentApi from '../../../api/deploymentApi';
// Avoid importing MemoryRouter to bypass resolver issues; mock router hooks instead.
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  useLocation: () => ({ pathname: '/admin' }),
}), { virtual: true });
import AdminHome from '../../../pages/Admin/AdminHome';
jest.mock('../../../auth/useKeycloak', () => ({ useAuth: () => ({ isAuthenticated: true, token: 't' }) }));
jest.mock('../../../contexts/UserContext', () => ({ useUser: () => ({ user: { id: 1, username: 'test' } }) }));
jest.mock('../../../components/ModalProvider', () => ({ useModal: () => ({ show: jest.fn(), openModal: jest.fn(), closeModal: jest.fn() }) }));

describe('AdminHome: error states behavior', () => {
  beforeEach(() => {
    jest.spyOn(userApi, 'fetchAllUsers').mockRejectedValue(new Error('fail'));
    jest.spyOn(boardApi, 'fetchMyBoards').mockRejectedValue(new Error('fail'));
    jest.spyOn(taskApi, 'fetchTasksByBoard').mockRejectedValue(new Error('fail'));
    jest.spyOn(groupApi, 'getAllGroups').mockRejectedValue(new Error('fail'));
    jest.spyOn(deploymentApi, 'getDeploymentHistory').mockRejectedValue(new Error('fail'));
    jest.spyOn(deploymentApi, 'getCurrentProductionDeployment').mockRejectedValue(new Error('fail'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders even when key APIs reject and shows fallback sections', async () => {
    render(<AdminHome />);
    // Page heading present
    const headings = await screen.findAllByRole('heading', { name: /Admin/i });
    expect(headings.length).toBeGreaterThan(0);

    // Fallback widgets should still render key tiles
    await waitFor(() => {
      expect(screen.getByText(/new accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/pending approvals/i)).toBeInTheDocument();
      expect(screen.getByText(/active projects/i)).toBeInTheDocument();
    });
  });
});
