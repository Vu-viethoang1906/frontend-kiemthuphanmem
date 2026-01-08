import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock toast to keep output clean
jest.mock('react-hot-toast', () => ({ success: jest.fn(), error: jest.fn() }));
// Mock modal confirm to auto-approve actions
jest.mock('../../../components/ModalProvider', () => ({ useModal: () => ({ confirm: jest.fn().mockResolvedValue(true), show: jest.fn() }) }));
// Mock react-router-dom hooks (virtual) to satisfy imports
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  // Start on deleted tab so deleted users load immediately
  useSearchParams: () => [new URLSearchParams('tab=deleted'), jest.fn()],
  Outlet: () => null,
  MemoryRouter: ({ children }: any) => <div>{children}</div>,
}), { virtual: true });


// Mocks for APIs used by the page (stateful to simulate before/after restore)
// Mock axiosInstance instead of userApi to ensure component data flow triggers
jest.mock('../../../api/axiosInstance', () => {
  let restored = false;
  const mockDeletedUser = {
    _id: 'u-del-1',
    username: 'deleted.user',
    email: 'deleted.user@gmail.com',
    full_name: 'Deleted User',
    status: 'inactive',
    roles: [{ _id: 'r1', name: 'user' }],
    deleted_at: '2025-11-01T00:00:00Z',
  };
  return {
    get: jest.fn((url: string) => {
      if (url.startsWith('/user/admin/deleted')) {
        return Promise.resolve({ data: restored ? { users: [], pagination: { total: 0 } } : { users: [mockDeletedUser], pagination: { total: 1 } } });
      }
      if (url.startsWith('/user/selectAll')) {
        return Promise.resolve({ data: { success: true, users: [] } });
      }
      return Promise.resolve({ data: {} });
    }),
    put: jest.fn((url: string) => {
      if (url.startsWith('/user/restore/')) {
        restored = true;
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: { success: true } });
    }),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
  };
});

jest.mock('../../../api/roleApi', () => ({
  fetchAllRoles: () => Promise.resolve({ data: [{ _id: 'r1', name: 'user' }] }),
}));

jest.mock('../../../api/centerApi', () => ({
  getAllCenters: () => Promise.resolve({ success: true, data: [] }),
}));

jest.mock('../../../api/centerMemberApi', () => ({
  addCenterMember: jest.fn(() => Promise.resolve({})),
  removeCenterMember: jest.fn(() => Promise.resolve({})),
  getCenterMembers: jest.fn(() => Promise.resolve({ data: [] })),
}));

// Import after mocks are set up so component uses mocked modules
// Import component dynamically inside the test after mocks are set

describe('UserManagement - restore deleted user flow', () => {
  test('restores a deleted user after confirmation and refreshes list', async () => {
    // Import after mocks
    const { default: UserManagement } = require('../../../pages/Admin/UserManagement');
    render(<UserManagement />);

    // Header present
    await screen.findByRole('heading', { name: /user management/i });

    // Ensure restore button rendered (row present)
    const restoreBtn = await screen.findByTitle(/restore user/i);
    await userEvent.click(restoreBtn);

    // Confirmation auto-accepted via mocked useModal

    // After restore, the deleted list becomes empty
    await screen.findByText(/no deleted users found/i);
  });
});
