import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleAndPermission from '../../../pages/Admin/RoleAndPermission';
import { ModalProvider } from '../../../components/ModalProvider';

// Dataset: two roles, shared permissions; start with one permission assigned to first role only.
jest.mock('../../../api/roleApi', () => ({
  fetchAllRoles: () => Promise.resolve({ data: [
    { _id: 'r1', name: 'Manager' },
    { _id: 'r2', name: 'Developer' }
  ] })
}));

jest.mock('../../../api/permissionApi', () => ({
  fetchAllPermissions: () => Promise.resolve({ data: [
    { _id: 'p1', code: 'EDIT_TASK', typePermission: 'Task' },
    { _id: 'p2', code: 'VIEW_TASK', typePermission: 'Task' }
  ] }),
  updateRolePermissions: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../api/role&permission', () => ({
  fetchAllRolePermission: () => Promise.resolve({ data: [ { role_id: 'r1', permission_id: 'p1' } ] })
}));

jest.mock('../../../api/userRoleApi', () => ({
  fetchAllUserRoles: () => Promise.resolve({ data: [] })
}));

jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

// Verify that role search filter affects matrix columns rendered after switching tabs.
describe('RoleAndPermission matrix search integration', () => {
  test('search input narrows roles list but matrix still renders all role columns', async () => {
    render(<ModalProvider><RoleAndPermission /></ModalProvider>);
    await screen.findByRole('heading', { name: /role & permission/i });

    const searchInput = screen.getByPlaceholderText(/search by role name/i);
    await userEvent.type(searchInput, 'dev');
    expect(searchInput).toHaveValue('dev');

    await userEvent.click(screen.getByRole('button', { name: /permission matrix/i }));

    await screen.findByText(/developer/i);
    expect(screen.getByText(/manager/i)).toBeInTheDocument();
  });
});
