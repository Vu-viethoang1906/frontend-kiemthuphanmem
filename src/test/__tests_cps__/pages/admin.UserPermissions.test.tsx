import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Router mocks (virtual to avoid ESM resolution issues)
jest.mock('react-router-dom', () => ({
  useParams: () => ({ userId: 'u1' }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

// API mocks for role&permission
jest.mock('../../../api/role&permission', () => {
  const getRolebyIdUser = jest.fn();
  const fetchAllPermission = jest.fn();
  const fetchAllRolePermission = jest.fn();
  const updateRolePermissions = jest.fn();
  return {
    __esModule: true,
    getRolebyIdUser,
    fetchAllPermission,
    fetchAllRolePermission,
    updateRolePermissions,
  };
});

const renderPage = async () => {
  const rpApi = require('../../../api/role&permission');
  rpApi.getRolebyIdUser.mockResolvedValueOnce({ data: [{ _id: 'role-1' }] });
  rpApi.fetchAllPermission.mockResolvedValueOnce({ data: [
    { _id: 'p1', code: 'USER_VIEW' },
    { _id: 'p2', code: 'GROUP_EDIT' },
  ]});
  rpApi.fetchAllRolePermission.mockResolvedValueOnce({ data: [
    { role_id: { _id: 'role-1' }, permission_id: { _id: 'p1' } },
  ]});

  const { default: UserPermissions } = require('../../../pages/Admin/UserPermissions');
  render(<UserPermissions />);
  await screen.findByText(/User Permissions/i);
};

describe('pages/Admin/UserPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads permissions grouped by category and saves changes', async () => {
    await renderPage();

  // Expect permission labels visible
  expect(await screen.findByText('USER_VIEW')).toBeInTheDocument();
  expect(screen.getByText('GROUP_EDIT')).toBeInTheDocument();

    // Toggle GROUP_EDIT on
  const groupLabel = screen.getByText('GROUP_EDIT');
    const groupCheckbox = groupLabel.closest('label')?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(groupCheckbox).toBeInTheDocument();
    await userEvent.click(groupCheckbox);

  const api = require('../../../api/role&permission');
  api.updateRolePermissions.mockResolvedValueOnce({});
  await userEvent.click(screen.getByRole('button', { name: /Save permissions/i }));
  await waitFor(() => expect(api.updateRolePermissions).toHaveBeenCalled());
  });
});
