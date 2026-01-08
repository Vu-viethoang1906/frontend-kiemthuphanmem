// Unskipped: keep real behavior test below
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalProvider } from '../../../components/ModalProvider';
import CenterManagement from '../../../pages/Center/CenterManagement';

// Virtual router mock (avoid ESM resolution issues)
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/dashboard/centers' }),
  Outlet: () => <div />,
  MemoryRouter: ({ children }: any) => <div>{children}</div>,
  NavLink: ({ children }: any) => <span>{children}</span>,
  Link: ({ children }: any) => <span>{children}</span>,
}), { virtual: true });

// Mock APIs used
jest.mock('../../../api/centerApi', () => ({
  getAllCenters: jest.fn(() => Promise.resolve({ success: true, data: [
    { _id: 'c1', name: 'North Campus', status: 'active', description: 'Northern hub' },
    { _id: 'c2', name: 'South Campus', status: 'inactive', description: 'Southern hub' },
  ] })),
  createCenter: jest.fn(),
  updateCenter: jest.fn(),
  deleteCenter: jest.fn(),
}));

// Dynamic import inside component pulls centerMemberApi
jest.mock('../../../api/centerMemberApi', () => ({
  getCenterMembers: jest.fn(() => Promise.resolve({ success: true, data: [] }))
}));

// Silence toast notifications
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));

describe('CenterManagement behavior', () => {
  beforeEach(() => {
    // Ensure admin role present so Create button renders
    localStorage.setItem('roles', JSON.stringify(['admin']));
  });

  test('renders header, search interaction, shows empty state on unmatched search, opens and closes create modal', async () => {
    render(<ModalProvider><CenterManagement /></ModalProvider>);

    // Header
    expect(await screen.findByRole('heading', { name: /centers management/i })).toBeInTheDocument();

    // Stats card shows Total Centers with count (semantic text)
    expect(await screen.findByText(/total centers/i)).toBeInTheDocument();

    // Create button present (admin)
    const createBtn = screen.getByRole('button', { name: /create new center/i });
    expect(createBtn).toBeInTheDocument();

    // Search unmatched -> No centers found state
    const searchInput = screen.getByPlaceholderText(/search centers by name/i);
    fireEvent.change(searchInput, { target: { value: 'zzz' } });
    await waitFor(() => {
      expect(screen.getByText(/no centers found/i)).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(createBtn);
    expect(await screen.findByRole('heading', { name: /create new center/i })).toBeInTheDocument();

    // Close via cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /create new center/i })).not.toBeInTheDocument();
    });
  });

  test('shows empty state when API returns no centers', async () => {
    const centerApi = require('../../../api/centerApi');
    centerApi.getAllCenters.mockResolvedValueOnce({ success: true, data: [] });

    render(<ModalProvider><CenterManagement /></ModalProvider>);

    expect(await screen.findByRole('heading', { name: /centers management/i })).toBeInTheDocument();
    // Loading then empty list state
    expect(await screen.findByText(/no centers found/i)).toBeInTheDocument();
  });

  test('handles API failure gracefully (base UI intact)', async () => {
    const centerApi = require('../../../api/centerApi');
    centerApi.getAllCenters.mockResolvedValueOnce({ success: false, message: 'Server error' });

    render(<ModalProvider><CenterManagement /></ModalProvider>);

    // Base heading remains rendered
    expect(await screen.findByRole('heading', { name: /centers management/i })).toBeInTheDocument();

    // Search input stays enabled for user retry/filter
    const searchInput = await screen.findByPlaceholderText(/search centers by name/i);
    expect(searchInput).toBeEnabled();

    // No centers list should be displayed as a fallback state
    // Prefer visible indicator text over strict role coupling
    await waitFor(() => {
      expect(
        screen.queryByText(/no centers found/i)
      ).toBeInTheDocument();
    });
  });
});
