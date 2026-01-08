import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleAndPermission from '../../../pages/Admin/RoleAndPermission';
import { ModalProvider } from '../../../components/ModalProvider';

// Inline deterministic dataset: one role, two permissions; only VIEW_TASK initially assigned.
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
  fetchAllRolePermission: () => Promise.resolve({ data: [ { role_id: 'r1', permission_id: 'p2' } ] })
}));

jest.mock('../../../api/userRoleApi', () => ({
  fetchAllUserRoles: () => Promise.resolve({ data: [] })
}));

// Mock toast to observe success feedback without DOM portal dependence.
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('react-hot-toast', () => ({ success: (...args: any[]) => mockToastSuccess(...args), error: (...args: any[]) => mockToastError(...args) }));

describe('RoleAndPermission matrix add permission flow', () => {
  test('adds an unchecked permission via confirm dialog and reflects checked state', async () => {
    render(<ModalProvider><RoleAndPermission /></ModalProvider>);

    // Ensure page loaded
    await screen.findByRole('heading', { name: /role & permission/i });

    // Switch to matrix tab
    await userEvent.click(await screen.findByRole('button', { name: /permission matrix/i }));

    // Expect both permission codes visible
    await screen.findByText('EDIT_TASK');
    await screen.findByText('VIEW_TASK');

    // Initial checkboxes: VIEW_TASK checked, EDIT_TASK unchecked
    const initialBoxes = screen.getAllByRole('checkbox');
    expect(initialBoxes).toHaveLength(2);
    const unchecked = initialBoxes.find(b => !(b as HTMLInputElement).checked)!;
    expect(unchecked).toBeDefined();

    // Click unchecked to trigger confirm dialog
    await userEvent.click(unchecked);

    // Confirm dialog appears with expected wording (paragraph only)
    await screen.findByText(/add permission "EDIT_TASK" to role "Manager"/i);

    // Confirm the action
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await userEvent.click(confirmButton);

    // Wait for updateRolePermissions to be called and toast fired
    await waitFor(() => {
      expect(require('../../../api/permissionApi').updateRolePermissions).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith('Permission added successfully!');
    });

    // Checkboxes now all checked
    const finalBoxes = screen.getAllByRole('checkbox');
    expect(finalBoxes.every(b => (b as HTMLInputElement).checked)).toBe(true);
  });
});
