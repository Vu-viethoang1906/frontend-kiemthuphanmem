/* Simplified stable matrix presence test: ensures matrix tab renders baseline structure without brittle permission interactions. */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalProvider } from '../../../components/ModalProvider';
import RoleAndPermission from '../../../pages/Admin/RoleAndPermission';

jest.mock('react-router-dom', () => ({
	useNavigate: () => jest.fn(),
}), { virtual: true });

// Minimal mocks returning empty datasets to keep UI predictable
jest.mock('../../../api/roleApi', () => ({ fetchAllRoles: jest.fn(() => Promise.resolve({ data: [] })) }));
jest.mock('../../../api/permissionApi', () => ({ fetchAllPermissions: jest.fn(() => Promise.resolve({ data: [] })), updateRolePermissions: jest.fn() }));
jest.mock('../../../api/role&permission', () => ({ fetchAllRolePermission: jest.fn(() => Promise.resolve({ data: [] })) }));
jest.mock('../../../api/userRoleApi', () => ({ fetchAllUserRoles: jest.fn(() => Promise.resolve({ data: [] })) }));
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

describe('RoleAndPermission matrix presence', () => {
  test('renders header then matrix tab with FUNCTION column', async () => {
    render(<ModalProvider><RoleAndPermission /></ModalProvider>);
    expect(await screen.findByRole('heading', { name: /role & permission/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /permission matrix/i }));
    expect(await screen.findByText(/function/i)).toBeInTheDocument();
  });
});

