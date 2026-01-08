import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoleAndPermission from '../../../pages/Admin/RoleAndPermission';
import { ModalProvider } from '../../../components/ModalProvider';

// Virtual mock of react-router-dom (ESM v7) similar to other admin tests
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/admin/role-permission' }),
  Outlet: () => <div />,
  MemoryRouter: ({ children }: any) => <div>{children}</div>,
  NavLink: ({ children }: any) => <span>{children}</span>,
  Link: ({ children }: any) => <span>{children}</span>,
}), { virtual: true });

// Mock APIs
jest.mock('../../../api/roleApi', () => ({
  fetchAllRoles: jest.fn(() => Promise.resolve({ data: [ { _id: 'r1', name: 'Manager' } ] })),
  createRole: jest.fn(),
  updateRole: jest.fn(),
  deleteRole: jest.fn()
}));

jest.mock('../../../api/permissionApi', () => ({
  fetchAllPermissions: jest.fn(() => Promise.resolve({ data: [ { _id: 'p1', code: 'TASK_VIEW', typePermission: 'Task' } ] })),
  updateRolePermissions: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../api/role&permission', () => ({
  fetchAllRolePermission: jest.fn(() => Promise.resolve({ data: [] }))
}));

jest.mock('../../../api/userRoleApi', () => ({
  fetchAllUserRoles: jest.fn(() => Promise.resolve({ data: [] }))
}));

// Silence toast side effects
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

describe('Admin Role & Permission page behavior', () => {
  test('renders, filters roles, opens Add Role modal and switches tabs', async () => {
    render(<ModalProvider><RoleAndPermission /></ModalProvider>);

    // Heading appears after loading resolves
    expect(await screen.findByRole('heading', { name: /role & permission/i })).toBeInTheDocument();

    // Add Role button present
    const addButton = screen.getByRole('button', { name: /add role/i });
    expect(addButton).toBeInTheDocument();

    // Search filtering: enter unmatched term -> No roles found
    const searchInput = screen.getByPlaceholderText(/search by role name/i);
    fireEvent.change(searchInput, { target: { value: 'zzz' } });
    await waitFor(() => {
      expect(screen.getByText(/no roles found/i)).toBeInTheDocument();
    });

    // Open Add Role modal
    fireEvent.click(addButton);
    expect(await screen.findByRole('heading', { name: /add role/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter role name/i)).toBeInTheDocument();

    // Close modal via Cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /add role/i })).not.toBeInTheDocument();
    });

    // Switch to Permission Matrix tab and assert matrix identifier
    fireEvent.click(screen.getByRole('button', { name: /permission matrix/i }));
    expect(await screen.findByText(/function/i)).toBeInTheDocument();
  });
});
