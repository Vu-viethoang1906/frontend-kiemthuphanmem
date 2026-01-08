import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ModalProvider } from '../../../components/ModalProvider';
import userEvent from '@testing-library/user-event';

jest.mock('../../../api/templateApi', () => ({ fetchTemplates: jest.fn().mockResolvedValue({ data: [] }) }));
jest.mock('../../../api/boardApi', () => ({
  fetchMyBoards: jest.fn().mockResolvedValue({ data: [{ _id: 'b1', title: 'Board One' }], pagination: { total: 1, pages: 1 } }),
  createBoard: jest.fn().mockResolvedValue({ data: { _id: 'b2' } }),
  deleteBoard: jest.fn().mockResolvedValue({}),
  cloneBoardFromTemplate: jest.fn().mockResolvedValue({ data: { _id: 'b3' } }),
}));
jest.mock('../../../api/boardMemberApi', () => ({ fetchBoardMembers: jest.fn().mockResolvedValue({ data: { data: [] } }) }));
jest.mock('../../../api/avataApi', () => ({ fetchAvatarUser: jest.fn().mockResolvedValue({ avatar_url: '' }) }));
jest.mock('../../../api/axiosInstance', () => ({ get: jest.fn().mockResolvedValue({ data: { data: { _id: 'u1' } } }) }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/projects', search: '' }),
}), { virtual: true });

describe('Projects page behavior', () => {
  beforeEach(() => jest.clearAllMocks());

  const setup = async () => {
  const { default: Projects } = await import('../../../pages/Project/Projects');
    return render(
      <ModalProvider>
        <Projects />
      </ModalProvider>
    );
  };

  it('loads boards and templates and renders', async () => {
    await setup();
    await waitFor(() => {
      expect(screen.getByText(/Board One/i)).toBeInTheDocument();
    });
  });
});
