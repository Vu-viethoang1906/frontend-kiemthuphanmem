import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleAndPermission from '../../../pages/Admin/RoleAndPermission';
import { ModalProvider } from '../../../components/ModalProvider';

// Dataset: one role, two permissions; both initially assigned so we will remove one.
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
  fetchAllRolePermission: () => Promise.resolve({ data: [
    { role_id: 'r1', permission_id: 'p1' },
    { role_id: 'r1', permission_id: 'p2' }
  ] })
}));

jest.mock('../../../api/userRoleApi', () => ({
  fetchAllUserRoles: () => Promise.resolve({ data: [] })
}));

// Toast mocks (prefixed with mock to allow jest.mock factory reference)
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('react-hot-toast', () => ({ success: (...args: any[]) => mockToastSuccess(...args), error: (...args: any[]) => mockToastError(...args) }));

// Remove flow: uncheck a checked permission -> confirm removal -> toast + state update
describe('RoleAndPermission matrix remove permission flow', () => {
  test('removes a checked permission via confirm dialog and reflects unchecked state', async () => {
    render(<ModalProvider><RoleAndPermission /></ModalProvider>);

    // Ensure page loaded
    await screen.findByRole('heading', { name: /role & permission/i });

    // Switch to matrix tab
    await userEvent.click(await screen.findByRole('button', { name: /permission matrix/i }));

    // Permission codes visible
    await screen.findByText('EDIT_TASK');
    await screen.findByText('VIEW_TASK');

    // All checkboxes initially checked
    const initialBoxes = screen.getAllByRole('checkbox');
    expect(initialBoxes).toHaveLength(2);
    initialBoxes.forEach(b => expect((b as HTMLInputElement).checked).toBe(true));

    // Choose one (EDIT_TASK assumed first unchecked action) and click to remove
    const targetBox = initialBoxes[0];
    await userEvent.click(targetBox);

    // Confirm removal paragraph appears
    await screen.findByText(/remove permission "EDIT_TASK" from role "Manager"/i);

    // Confirm
    await userEvent.click(screen.getByRole('button', { name: /confirm/i }));

    // Wait for API + toast
    await waitFor(() => {
      expect(require('../../../api/permissionApi').updateRolePermissions).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith('Permission removed successfully!');
    });

    // Re-read checkboxes; one should now be unchecked
    const finalBoxes = screen.getAllByRole('checkbox');
    const checkedCount = finalBoxes.filter(b => (b as HTMLInputElement).checked).length;
    expect(checkedCount).toBe(1);
  });
});
