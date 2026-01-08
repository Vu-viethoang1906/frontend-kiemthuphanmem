import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateManagement from '../../../pages/Template/TemplateManagement';
import { ModalProvider } from '../../../components/ModalProvider';
jest.mock('react-router-dom', () => ({
  Navigate: ({ children }: any) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/templates' }),
  useSearchParams: () => [new URLSearchParams(''), jest.fn()],
}), { virtual: true });

jest.mock('../../../api/templateApi', () => ({
  getAllTemplates: jest.fn(async () => ({ data: [] })),
}));

describe('TemplateManagement behavior: basic empty render', () => {
  test('renders with empty list message', async () => {
    render(
      <ModalProvider>
        <TemplateManagement />
      </ModalProvider>
    );
    const empty = await screen.findByText(/No templates/i);
    expect(empty).toBeInTheDocument();
  });
});
