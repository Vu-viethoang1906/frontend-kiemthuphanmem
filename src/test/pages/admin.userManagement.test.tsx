import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalProvider } from '../../components/ModalProvider';

jest.mock('react-router-dom', () => ({
  useNavigate: () => (() => {}),
  useSearchParams: () => [new URLSearchParams(''), jest.fn()],
}), { virtual: true });
jest.mock('../../components/HelpButton/HelpButton', () => () => null);
const UserManagement = require('../../pages/Admin/UserManagement').default;

test('renders UserManagement with table/actions', async () => {
  render(<ModalProvider><UserManagement /></ModalProvider>);
  const headings = await screen.findAllByText(/user|manage|role|permission/i);
  expect(headings.length).toBeGreaterThan(0);
});
