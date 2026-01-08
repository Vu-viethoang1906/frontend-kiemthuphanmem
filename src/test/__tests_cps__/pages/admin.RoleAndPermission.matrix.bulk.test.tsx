import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleAndPermission from '../../../pages/Admin/RoleAndPermission';
import { ModalProvider } from '../../../components/ModalProvider';

// Dataset: one role, two permissions; start with only first permission assigned (to observe both directions)
jest.mock('../../../api/roleApi', () => ({
  fetchAllRoles: () => Promise.resolve({ data: [ { _id: 'r1', name: 'Manager' } ] })
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

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('react-hot-toast', () => ({ success: (...args: any[]) => mockToastSuccess(...args), error: (...args: any[]) => mockToastError(...args) }));

// Helper to get all permission checkboxes (excluding FUNCTION column placeholder cells)
const getMatrixCheckboxes = () => screen.getAllByRole('checkbox');

describe('RoleAndPermission bulk select / deselect flows', () => {
  test('select all then remove all updates checkbox states and shows confirmations', async () => {
    render(<ModalProvider><RoleAndPermission /></ModalProvider>);

    // Wait for page & switch to matrix
    await screen.findByRole('heading', { name: /role & permission/i });
    await userEvent.click(screen.getByRole('button', { name: /permission matrix/i }));

    // Initial: one checked, one unchecked
    const initialBoxes = getMatrixCheckboxes();
    expect(initialBoxes).toHaveLength(2);
    const initiallyCheckedCount = initialBoxes.filter(b => (b as HTMLInputElement).checked).length;
    expect(initiallyCheckedCount).toBe(1);

    // Click Select All button -> confirm dialog (paragraph only)
    await userEvent.click(screen.getByRole('button', { name: /select all/i }));
    await screen.findByText(/grant ALL permissions \(2 permissions\) to role "Manager"/i);
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      // updateRolePermissions called with all permissions
      expect(require('../../../api/permissionApi').updateRolePermissions).toHaveBeenCalledWith('r1', expect.arrayContaining(['p1','p2']));
      expect(mockToastSuccess).toHaveBeenCalledWith('Granted all 2 permissions to "Manager" successfully!');
    });

    // All boxes now checked
    const afterSelectAll = getMatrixCheckboxes();
    expect(afterSelectAll.every(b => (b as HTMLInputElement).checked)).toBe(true);

    // Click Remove All button -> confirm dialog (paragraph only)
    await userEvent.click(screen.getByRole('button', { name: /remove all/i }));
    await screen.findByText(/remove all permissions \(2 permissions\) from role "Manager"/i);
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      // Called with empty list
      expect(require('../../../api/permissionApi').updateRolePermissions).toHaveBeenCalledWith('r1', []);
      expect(mockToastSuccess).toHaveBeenCalledWith('Removed all permissions from "Manager" successfully!');
    });

    const afterRemoveAll = getMatrixCheckboxes();
    expect(afterRemoveAll.some(b => (b as HTMLInputElement).checked)).toBe(false);
  });
});
