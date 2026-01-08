import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleAndPermission from '../../../pages/Admin/RoleAndPermission';
import { ModalProvider } from '../../../components/ModalProvider';

// Deterministic mocks for initial matrix state: one role, two permissions, one assigned.
jest.mock('../../../api/roleApi', () => ({
  fetchAllRoles: () => Promise.resolve({ data: [ { _id: 'r1', name: 'Manager' } ] })
}));

jest.mock('../../../api/permissionApi', () => ({
  fetchAllPermissions: () => Promise.resolve({ data: [
    { _id: 'p1', code: 'EDIT_TASK', typePermission: 'Task' },
    { _id: 'p2', code: 'VIEW_TASK', typePermission: 'Task' }
  ] }),
  updateRolePermissions: jest.fn()
}));

jest.mock('../../../api/role&permission', () => ({
  fetchAllRolePermission: () => Promise.resolve({ data: [ { role_id: 'r1', permission_id: 'p2' } ] })
}));

jest.mock('../../../api/userRoleApi', () => ({
  fetchAllUserRoles: () => Promise.resolve({ data: [] })
}));

// Silence toasts
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

describe('RoleAndPermission matrix initial state', () => {
  test('renders permission codes with correct checked mapping (one checked, one unchecked)', async () => {
    render(
      <ModalProvider>
        <RoleAndPermission />
      </ModalProvider>
    );

    // Wait for page header (data loaded)
    await screen.findByRole('heading', { name: /role & permission/i });

    // Switch to matrix tab
    const matrixTab = await screen.findByRole('button', { name: /permission matrix/i });
    await userEvent.click(matrixTab);

    // Permission codes visible
    await screen.findByText('EDIT_TASK');
    await screen.findByText('VIEW_TASK');

    const boxes = screen.getAllByRole('checkbox');
    // Expect exactly two checkboxes (one per permission for the single role)
    expect(boxes).toHaveLength(2);
    const checkedCount = boxes.filter(b => (b as HTMLInputElement).checked).length;
    expect(checkedCount).toBe(1); // Only VIEW_TASK assigned
  });
});
