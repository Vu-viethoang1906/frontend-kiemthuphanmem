import React from 'react';
// Mock ModalProvider hook to avoid provider requirement in smoke
jest.mock('../../components/ModalProvider', () => ({
  useModal: () => ({
    openModal: jest.fn(),
    closeModal: jest.fn(),
    show: jest.fn(),
    isOpen: false,
    content: null,
  }),
}));
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Safe router stubs
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/centers', search: '' }),
  useSearchParams: () => [new URLSearchParams('')],
  Outlet: () => null,
  NavLink: (props: any) => <a href={props.to}>{props.children}</a>,
}), { virtual: true });

// Mock UserContext to avoid provider requirements
jest.mock('../../contexts/UserContext', () => {
  const actual = jest.requireActual('../../contexts/UserContext');
  return {
    ...actual,
    useUser: () => ({ user: { id: 'u1', name: 'Smoke' }, setUser: jest.fn() }),
  };
});

// Mock auth hook
jest.mock('../../auth/useKeycloak', () => ({
  useAuth: () => ({ logout: jest.fn(), username: 'smoke-user' }),
}));

// Minimal API/sidebar mocks used by CenterManagement
jest.mock('../../api/sidebarApi', () => ({
  getBasicSidebarConfig: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../../api/centerApi', () => ({
  getCenters: jest.fn(() => Promise.resolve([])),
}));

import CenterManagement from '../../pages/Center/CenterManagement';

describe('Smoke: Center Management page renders', () => {
  test('renders and shows centers heading', async () => {
    render(<CenterManagement />);

    // Expect top-level Centers Management heading present
    const headings = await screen.findAllByRole('heading', { name: /Centers Management|Center/i });
    expect(headings.length).toBeGreaterThan(0);
  });
});
