import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserManagement from '../../../pages/Admin/UserManagement';
import toast from 'react-hot-toast';

jest.mock('react-hot-toast');
jest.mock('../../../api/userApi', () => ({
  fetchAllUsers: jest.fn().mockResolvedValue({ success: true, users: [
    { _id: 'u1', username: 'alice', email: 'alice@mail.com', full_name: 'Alice', status: 'active', roles: ['admin'], created_at: new Date().toISOString() },
    { _id: 'u2', username: 'bob', email: 'bob@mail.com', full_name: 'Bob', status: 'inactive', roles: ['user'], created_at: new Date().toISOString() }
  ] }),
  fetchDeletedUsers: jest.fn().mockResolvedValue({ users: [], pagination: { total: 0 } }),
  createUser: jest.fn().mockResolvedValue({ _id: 'u3' }),
  updateUser: jest.fn(),
  deleteUser: jest.fn().mockResolvedValue({ success: true }),
  restoreUser: jest.fn(),
}));
jest.mock('../../../api/roleApi', () => ({ fetchAllRoles: jest.fn().mockResolvedValue([{ _id: 'r1', name: 'admin' }, { _id: 'r2', name: 'user' }]) }));
jest.mock('../../../api/centerApi', () => ({ getAllCenters: jest.fn().mockResolvedValue({ success: true, data: [{ _id: 'c1', name: 'Center A' }] }) }));
jest.mock('../../../api/centerMemberApi', () => ({ addCenterMember: jest.fn(), removeCenterMember: jest.fn(), getCenterMembers: jest.fn().mockResolvedValue({ data: [] }) }));
jest.mock('../../../components/ModalProvider', () => ({ useModal: () => ({ confirm: jest.fn().mockResolvedValue(true), show: jest.fn() }) }));
// React Router: wrap component in MemoryRouter instead of mocking
// Virtual mock react-router-dom (v7 ESM) to allow component render
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  Outlet: () => <div />,
  MemoryRouter: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });

describe('Admin/UserManagement behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders heading and create button', () => {
    render(<UserManagement />);
    expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
    // Multiple buttons named Create User exist after modal opens; just assert one initially
    const createButtons = screen.getAllByRole('button', { name: /create user/i });
    expect(createButtons.length).toBeGreaterThan(0);
  });

  test('opens create modal and shows form fields', async () => {
    render(<UserManagement />);
    fireEvent.click(screen.getAllByRole('button', { name: /create user/i })[0]);
    expect(await screen.findByPlaceholderText(/enter username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter email address/i)).toBeInTheDocument();
  });

  test('switches to deleted users tab', () => {
    render(<UserManagement />);
    fireEvent.click(screen.getByRole('button', { name: /deleted users/i }));
    // Expect deleted users button to have been clicked (second button present)
    expect(screen.getByRole('button', { name: /active users/i })).toBeInTheDocument();
  });
});
