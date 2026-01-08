import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Safe router stubs
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/projects', search: '' }),
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

// Minimal API mocks used by Projects page
jest.mock('../../api/boardApi', () => ({
  fetchMyBoards: jest.fn(() => Promise.resolve({ data: [] })),
}));
jest.mock('../../api/sidebarApi', () => ({
  getBasicSidebarConfig: jest.fn(() => Promise.resolve([])),
}));

// Mock ModalProvider hook to avoid provider requirement
jest.mock('../../components/ModalProvider', () => {
  const actual = jest.requireActual('../../components/ModalProvider');
  return {
    ...actual,
    useModal: () => ({ open: jest.fn(), close: jest.fn() }),
  };
});

import Projects from '../../pages/Project/Projects';

describe('Smoke: Projects page renders', () => {
  test('renders and shows project navigation', async () => {
    render(<Projects />);

    // Expect a visible heading labelled Project
    expect(await screen.findByRole('heading', { name: /Project/i })).toBeInTheDocument();
  });
});
