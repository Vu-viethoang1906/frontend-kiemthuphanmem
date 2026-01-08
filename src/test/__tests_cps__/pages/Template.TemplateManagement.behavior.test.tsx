import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
// Avoid direct component import here to preserve mock initialization order
import userEvent from '@testing-library/user-event';
import { ModalProvider } from '../../../components/ModalProvider';

// Mock templateApi
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
  __esModule: true,
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

// Mock hooks
jest.mock('../../../hooks/useUrlState', () => ({
  useUrlState: () => [
    { page: '1', limit: '12', q: '', sortBy: 'created_at', sortOrder: 'desc' },
    jest.fn(),
  ],
}));

jest.mock('../../../hooks/useVietnameseSearch', () => ({
  useVietnameseSearch: () => ({
    searchValue: '',
    searchTerm: '',
    handleInputChange: jest.fn(),
    handleCompositionStart: jest.fn(),
    handleCompositionEnd: jest.fn(),
  }),
}));

// Mock DnD Kit
jest.mock('@dnd-kit/core', () => ({
  __esModule: true,
  DndContext: ({ children }: any) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}));

jest.mock('@dnd-kit/sortable', () => ({
  __esModule: true,
  arrayMove: jest.fn((arr, oldIndex, newIndex) => {
    const newArr = [...arr];
    const [removed] = newArr.splice(oldIndex, 1);
    newArr.splice(newIndex, 0, removed);
    return newArr;
  }),
  SortableContext: ({ children }: any) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
  verticalListSortingStrategy: jest.fn(),
}));

jest.mock('@dnd-kit/utilities', () => ({
  __esModule: true,
  CSS: {
    Transform: {
      toString: jest.fn(() => ''),
    },
  },
}));

// Mock toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  __esModule: true,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('TemplateManagement page behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTemplates.mockResolvedValue([
      {
        _id: 't1',
        name: 'Template 1',
        description: 'Description 1',
        created_at: new Date().toISOString(),
      },
      {
        _id: 't2',
        name: 'Template 2',
        description: 'Description 2',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    mockFetchTemplateColumns.mockResolvedValue([
      { _id: 'c1', name: 'Column 1', order: 1 },
      { _id: 'c2', name: 'Column 2', order: 2 },
    ]);
    mockFetchTemplateSwimlanes.mockResolvedValue([
      { _id: 's1', name: 'Swimlane 1', order: 1 },
    ]);
  });

    // Create/edit/delete flows validated in comprehensive suite; keeping behavior tests minimal to avoid brittle mocks ordering.

  const setup = async () => {
    const { default: TemplateManagement } = await import('../../../pages/Template/TemplateManagement');
    return render(
      <ModalProvider>
        <TemplateManagement />
      </ModalProvider>
    );
  };

  it('renders Template Management page with header', async () => {
    await setup();
    expect(await screen.findByText('Template Management')).toBeInTheDocument();
  });

  it('loads and displays templates', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Template 1')).toBeInTheDocument();
      expect(screen.getByText('Template 2')).toBeInTheDocument();
    });
  });

  it('displays search input', async () => {
    await setup();
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search templates/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('displays sort order selector', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText('Template Management')).toBeInTheDocument();
    });
    
    // Check that Order label exists and combobox is present
    expect(screen.getByText(/^Order$/i)).toBeInTheDocument();
    const selects = screen.getAllByRole('combobox');
    expect(selects.length).toBeGreaterThan(0);
  });

  it('has create template button', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /New Template/i })).toBeInTheDocument();
    });
  });

  it('opens create template modal when button is clicked', async () => {
    await setup();
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /New Template/i });
      expect(createButton).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /New Template/i });
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Create New Template/i)).toBeInTheDocument();
    });
  });

  it('displays edit and delete buttons for templates', async () => {
    await setup();
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /Edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows loading state when fetching templates', async () => {
    mockFetchTemplates.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    await setup();
    expect(screen.getByText(/Loading Templates/i)).toBeInTheDocument();
  });

  it('displays empty state when no templates found', async () => {
    mockFetchTemplates.mockResolvedValueOnce([]);

    await setup();
    await waitFor(() => {
      expect(screen.getByText(/No Templates Yet/i)).toBeInTheDocument();
    });
  });

  it('handles API failure gracefully (shows toast error)', async () => {
    mockFetchTemplates.mockRejectedValueOnce(new Error('Network error'));

    await setup();
    // Toast error is mocked; assert it was called
    const toast = (await import('react-hot-toast')).default as any;
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('renders template structure UI without crashing', async () => {
    await setup();
    // Verify core page header then presence of controls implying structure is rendered
    expect(await screen.findByText('Template Management')).toBeInTheDocument();
    const editButtons = await screen.findAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
  });
});

