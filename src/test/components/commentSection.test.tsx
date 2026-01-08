import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalProvider } from '../../components/ModalProvider';
import '@testing-library/jest-dom';

// Minimal mocks: router and toast
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }), { virtual: true });

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
};
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast,
  Toaster: () => null,
  toast: mockToast,
}));

// Mock API used inside CommentSection if it imports from api/commentApi
// Use spies on actual module to avoid cross-test interference
const actualCommentApi = jest.requireActual('../../api/commentApi');
afterEach(() => {
  jest.restoreAllMocks();
});

const CommentSection = require('../../components/CommentSection').default;

describe('CommentSection behavior', () => {
  test('renders and shows empty state when no comments', async () => {
    jest.spyOn(actualCommentApi, 'fetchCommentsByTask').mockResolvedValueOnce({ data: [] } as any);
    render(<ModalProvider><CommentSection taskId="t1" /></ModalProvider>);
    const empty = await screen.findAllByText(/No comments yet|Be the first to comment/i);
    expect(empty.length).toBeGreaterThan(0);
  });

  test('allows typing and posting a comment (shows submitting state)', async () => {
    const user = userEvent;
    jest.spyOn(actualCommentApi, 'fetchCommentsByTask').mockResolvedValueOnce({ data: [] } as any);
    jest.spyOn(actualCommentApi, 'createComment').mockResolvedValueOnce({ data: { _id: 'c1' } } as any);
    render(<ModalProvider><CommentSection taskId="t1" /></ModalProvider>);

    const textbox = await screen.findByRole('textbox');
    await user.type(textbox, 'Nice work!');
    const postBtn = await screen.findByRole('button', { name: /Send/i });
    await user.click(postBtn);

    // Current component behavior: shows submitting state and retains value
    await (await import('@testing-library/react')).waitFor(() => {
      expect(screen.getByRole('button', { name: /Sending.../i })).toBeDisabled();
      expect((textbox as HTMLTextAreaElement).value).toBe('Nice work!');
    });
  });

  test('shows error feedback when posting fails', async () => {
    // Override API mock for this test to reject
    jest.spyOn(actualCommentApi, 'fetchCommentsByTask').mockResolvedValueOnce({ data: [] } as any);
    jest.spyOn(actualCommentApi, 'createComment').mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent;
    render(<ModalProvider><CommentSection taskId="t1" /></ModalProvider>);

    const textbox = await screen.findByRole('textbox');
    await user.type(textbox, 'This will fail');
    const postBtn = await screen.findByRole('button', { name: /Send/i });
    await user.click(postBtn);

    // Assert button returns to idle label after error (loading state ends, button becomes enabled)
    await (await import('@testing-library/react')).waitFor(() => {
      const idleBtn = screen.getByRole('button', { name: /Send/i });
      expect(idleBtn).toBeEnabled();
    }, { timeout: 3000 });
  });
});
