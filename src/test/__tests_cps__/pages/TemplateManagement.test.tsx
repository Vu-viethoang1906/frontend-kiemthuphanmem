import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TemplateManagement from '../../../pages/Template/TemplateManagement';

const mockSetUrlState = jest.fn();
function mockUseUrlState() {
  return [{ page: '1', limit: '12', q: '', sortBy: 'created_at', sortOrder: 'desc' }, mockSetUrlState] as const;
}
function mockUseVietnameseSearch() {
  return {
    searchValue: '',
    searchTerm: '',
    handleInputChange: jest.fn(),
    handleCompositionStart: jest.fn(),
    handleCompositionEnd: jest.fn(),
  };
}

jest.mock('../../../hooks/useUrlState', () => ({ useUrlState: mockUseUrlState }));
jest.mock('../../../hooks/useVietnameseSearch', () => ({ useVietnameseSearch: mockUseVietnameseSearch }));

const mockFetchTemplates = jest.fn();
const mockCreateTemplate = jest.fn();
const mockUpdateTemplate = jest.fn();
const mockDeleteTemplate = jest.fn();
const mockFetchTemplateColumns = jest.fn();
const mockCreateTemplateColumn = jest.fn();
const mockUpdateTemplateColumn = jest.fn();
const mockDeleteTemplateColumn = jest.fn();
const mockFetchTemplateSwimlanes = jest.fn();
const mockCreateTemplateSwimlane = jest.fn();
const mockUpdateTemplateSwimlane = jest.fn();
const mockDeleteTemplateSwimlane = jest.fn();

jest.mock('../../../api/templateApi', () => ({
  fetchTemplates: (...args: any[]) => mockFetchTemplates(...args),
  createTemplate: (...args: any[]) => mockCreateTemplate(...args),
  updateTemplate: (...args: any[]) => mockUpdateTemplate(...args),
  deleteTemplate: (...args: any[]) => mockDeleteTemplate(...args),
  fetchTemplateColumns: (...args: any[]) => mockFetchTemplateColumns(...args),
  createTemplateColumn: (...args: any[]) => mockCreateTemplateColumn(...args),
  updateTemplateColumn: (...args: any[]) => mockUpdateTemplateColumn(...args),
  deleteTemplateColumn: (...args: any[]) => mockDeleteTemplateColumn(...args),
  fetchTemplateSwimlanes: (...args: any[]) => mockFetchTemplateSwimlanes(...args),
  createTemplateSwimlane: (...args: any[]) => mockCreateTemplateSwimlane(...args),
  updateTemplateSwimlane: (...args: any[]) => mockUpdateTemplateSwimlane(...args),
  deleteTemplateSwimlane: (...args: any[]) => mockDeleteTemplateSwimlane(...args),
}));

jest.mock('../../../components/ModalProvider', () => ({
  useModal: () => ({
    show: jest.fn(),
    confirm: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>,
  },
}));

const renderPage = () => render(<TemplateManagement />);

describe('TemplateManagement page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows templates after loading', async () => {
    const now = new Date().toISOString();
    mockFetchTemplates.mockResolvedValue([{ _id: 't1', name: 'Template One', description: 'Desc', created_at: now }]);

    renderPage();

    expect(screen.getByText(/Loading Templates/i)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(/Template One/i)).toBeInTheDocument());
    expect(screen.queryByText(/Access Denied/i)).not.toBeInTheDocument();
  });

  it('renders access denied when permission error occurs', async () => {
    mockFetchTemplates.mockRejectedValue({ response: { status: 403 } });

    renderPage();

    await waitFor(() => expect(screen.getByText(/Access Denied/i)).toBeInTheDocument());
    expect(screen.getByText(/You don't have permission/i)).toBeInTheDocument();
  });

  it('shows empty state when no templates', async () => {
    mockFetchTemplates.mockResolvedValue([]);

    renderPage();

    await waitFor(() => expect(screen.getByText(/No Templates Yet/i)).toBeInTheDocument());
    expect(screen.getByText(/Create your first template/i)).toBeInTheDocument();
  });
});
