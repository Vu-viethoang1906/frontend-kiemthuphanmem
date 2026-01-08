import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ModalProvider } from '../../../components/ModalProvider';

let __navigatedTo: string | null = null;
jest.mock('react-router-dom', () => ({
  useParams: () => ({ roleId: 'r1' }),
  useNavigate: () => (path: string) => { __navigatedTo = path; },
}), { virtual: true });

const mockUpdate = jest.fn().mockResolvedValue({});

jest.mock('../../../api/permissionApi', () => ({
  fetchRoleById: jest.fn().mockResolvedValue({ data: { _id: 'r1', name: 'Role One' } }),
  fetchAllPermissions: jest.fn().mockResolvedValue({ data: [
    { _id: 'p1', code: 'USER_VIEW' },
    { _id: 'p2', code: 'GROUP_EDIT' },
  ] }),
  // Component expects array of rolePerm objects; it's robust to rolePermRes?.data || []
  fetchPermissionsByRole: jest.fn().mockResolvedValue({ data: [
    { permission_id: { _id: 'p1' } },
  ] }),
  updateRolePermissions: (...args: any[]) => mockUpdate(...args),
}));

function renderPage() {
  // Import component after mocks are established
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Comp = require('../../../pages/Admin/RolePermissionEdit').default;
  return render(
    <ModalProvider>
      <Comp />
    </ModalProvider>
  );
}

describe('RolePermissionEdit', () => {
  it('loads permissions, toggles and saves', async () => {
    // Mock alert to avoid JSDOM not implemented error
    // @ts-ignore
    window.alert = jest.fn();
    renderPage();

    // Wait for content area to render by finding section header text from component
    await waitFor(() => expect(screen.getByText(/Danh sách quyền|Cập nhật quyền/i)).toBeInTheDocument());
  // Then wait for one of the permission labels to appear meaning load finished
  await waitFor(() => expect(screen.getByText('USER_VIEW')).toBeInTheDocument());

    // USER_VIEW is initially checked, GROUP_EDIT is not.
  // Find checkbox by traversing from the visible label text to its wrapping label
  const userViewLabel = screen.getByText('USER_VIEW');
  const userView = userViewLabel.closest('label')!.querySelector('input') as HTMLInputElement;
  const groupEditLabel = screen.getByText('GROUP_EDIT');
  const groupEdit = groupEditLabel.closest('label')!.querySelector('input') as HTMLInputElement;
    expect(userView.checked).toBe(true);
    expect(groupEdit.checked).toBe(false);

    // Toggle GROUP_EDIT on
    fireEvent.click(groupEdit);
    expect(groupEdit.checked).toBe(true);

    // Save
    fireEvent.click(screen.getByText(/Cập nhật quyền/i));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());

    // updateRolePermissions should be called with r1 and both p1 and p2
    const [rid, ids] = mockUpdate.mock.calls.slice(-1)[0];
    expect(rid).toBe('r1');
    expect(ids.sort()).toEqual(['p1','p2']);

    // After save, it navigates to list route
    await waitFor(() => expect(__navigatedTo).toBe('/admin/roleandpermission'));
  });
});
import fileExists from '../_utils/fileExists';
describe('pages/Admin/RolePermissionEdit', () => {
  it('should exist on disk', () => {
    expect(fileExists('pages/Admin/RolePermissionEdit')).toBe(true);
  });
});
