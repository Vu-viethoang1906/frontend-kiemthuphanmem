import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalProvider } from '../../../components/ModalProvider';

// Increase timeout for this suite (some flows await multiple async renders)
jest.setTimeout(20000);

// Router mocks (before component import)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/projects', search: '' }),
}), { virtual: true });

// Socket mock
jest.mock('../../../socket', () => ({
  socket: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}));

// Hook mocks
const mockSetUrlState = jest.fn();
jest.mock('../../../hooks/useUrlState', () => ({
  useUrlState: () => [
    { page: '1', limit: '10', q: '' },
    mockSetUrlState,
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

// API mocks
const mockFetchMyBoards = jest.fn().mockResolvedValue({ data: [
  { _id: 'b1', title: 'Board One', created_at: new Date().toISOString() },
], pagination: { total: 1, pages: 1 } });
const mockCreateBoard = jest.fn().mockResolvedValue({ data: { _id: 'b_new' } });
const mockCreateColumn = jest.fn().mockResolvedValue({});
jest.mock('../../../api/boardApi', () => ({
  __esModule: true,
  fetchMyBoards: (...args: any[]) => mockFetchMyBoards(...args),
  createBoard: (...args: any[]) => mockCreateBoard(...args),
}));
jest.mock('../../../api/columnApi', () => ({ __esModule: true, createColumn: (...args: any[]) => mockCreateColumn(...args) }));
jest.mock('../../../api/boardMemberApi', () => ({ fetchBoardMembers: jest.fn().mockResolvedValue({ data: { data: [] } }) }));
jest.mock('../../../api/avataApi', () => ({ fetchAvatarUser: jest.fn().mockResolvedValue({ avatar_url: '' }) }));
jest.mock('../../../api/axiosInstance', () => ({ get: jest.fn().mockResolvedValue({ data: { data: { _id: 'u1' } } }) }));
jest.mock('../../../api/fileApi', () => ({ importFileTask: jest.fn().mockResolvedValue({ success: true }) }));
jest.mock('../../../api/templateApi', () => ({ fetchTemplates: jest.fn().mockResolvedValue({ data: [] }) }));
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  // Ensure dismiss exists because the component calls toast.dismiss("project-import-limit")
  default: { success: jest.fn(), error: jest.fn(), dismiss: jest.fn() },
}));

describe('Projects higher coverage interactions', () => {
  const setup = async () => {
  const { default: Projects } = await import('../../../pages/Project/Projects');
    return render(
      <ModalProvider>
        <Projects />
      </ModalProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('creates board with default settings (modal flow completes)', async () => {
    await setup();
    
    // Wait for primary action button to be available
    const newBtn = await screen.findByRole('button', { name: /New project/i }, { timeout: 10000 });
    await userEvent.click(newBtn);

    // Wait for modal to appear and input to be available
    const name = await screen.findByPlaceholderText(/Enter project name/i);
    await userEvent.type(name, 'Board With Columns');

    // Click create button
    const createBtn = await screen.findByRole('button', { name: /Create project/i });
    await userEvent.click(createBtn);

    // Wait for API call to be made
    await waitFor(() => {
      expect(mockCreateBoard).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('triggers Import flow and calls importFileTask once a file is chosen', async () => {
  const { default: Projects } = await import('../../../pages/Project/Projects');
  const { importFileTask } = await import('../../../api/fileApi');
    render(<ModalProvider><Projects /></ModalProvider>);

    // Prepare a stubbed input element and a safe createElement mock
    const realCreateElement = document.createElement.bind(document);
    let onChangeHandler: ((e: any) => void) | null = null;
    const file = new File([JSON.stringify({})], 'data.json', { type: 'application/json' });

    const createEl = jest.spyOn(document, 'createElement').mockImplementation((tagName: any) => {
      if (tagName === 'input') {
        const stub: any = { type: 'file', accept: '.csv, .xlsx, .json' };
        Object.defineProperty(stub, 'onchange', {
          get: () => onChangeHandler,
          set: (fn) => { onChangeHandler = fn; },
        });
        stub.click = () => {
          onChangeHandler?.({ target: { files: [file] } });
        };
        return stub;
      }
      return realCreateElement(tagName);
    });

    // Click Import button to trigger mocked input click and onchange
    const importBtn = await screen.findByRole('button', { name: /Import/i });
    await userEvent.click(importBtn);

    await waitFor(() => expect((importFileTask as unknown as jest.Mock)).toHaveBeenCalled());

    createEl.mockRestore();
  });
});
