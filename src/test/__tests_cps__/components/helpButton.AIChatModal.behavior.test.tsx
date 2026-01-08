import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock useAuth to provide stable user id
jest.mock('../../../auth/useKeycloak', () => ({
  useAuth: () => ({ userInfo: { id: 'u1', username: 'alice' } })
}));

// Mock geminiService
const mockChat = jest.fn();
jest.mock('../../../services/geminiService', () => ({ __esModule: true, default: { chat: (...args: any[]) => mockChat(...args) } }));

import AIChatModal from '../../../components/HelpButton/AIChatModal';

describe('AIChatModal behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    mockChat.mockReset();
    // jsdom: stub scrollIntoView which is not implemented
    // @ts-ignore
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  it('toggles overlay class by isOpen', () => {
    const { rerender } = render(<AIChatModal isOpen={false} onClose={jest.fn()} />);
    const overlay = document.querySelector('.ai-chat-overlay') as HTMLElement;
    expect(overlay).toBeInTheDocument();
    expect(overlay.className).not.toMatch(/open/);
    rerender(<AIChatModal isOpen={true} onClose={jest.fn()} />);
    expect(overlay.className).toMatch(/open/);
  });

  it('shows initial assistant greeting', () => {
    render(<AIChatModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/Hello.*I'm your AI assistant/i)).toBeInTheDocument();
  });

  it('sends a user message and renders assistant reply', async () => {
    mockChat.mockImplementation(async () => {
      // simulate slight delay
      await new Promise(r => setTimeout(r, 10));
      return 'Xin chào! Tôi có thể giúp gì?';
    });
    render(<AIChatModal isOpen={true} onClose={jest.fn()} />);

    const input = screen.getByPlaceholderText(/type your question/i);
    await userEvent.type(input, 'Hello');
    // Send button lacks accessible name, select via class as fallback
    const sendBtn = document.querySelector('.ai-chat-send-btn') as HTMLElement;
    await userEvent.click(sendBtn);

    // user message appears
    expect(screen.getByText('Hello')).toBeInTheDocument();
    // loading indicator appears while waiting
    expect(document.querySelector('.typing-indicator')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(/xin chào! tôi có thể giúp gì\?/i)).toBeInTheDocument());
  });

  it('persists chat history to localStorage and reloads on remount', async () => {
    mockChat.mockResolvedValue('Reply 1');
    const { unmount } = render(<AIChatModal isOpen={true} onClose={jest.fn()} />);

    const input = screen.getByPlaceholderText(/type your question/i);
    await userEvent.type(input, 'Q1');
    const sendBtn = document.querySelector('.ai-chat-send-btn') as HTMLElement;
    await userEvent.click(sendBtn);
    await waitFor(() => expect(screen.getByText('Reply 1')).toBeInTheDocument());

    // persisted
    const stored = localStorage.getItem('ai_chat_history_u1');
    expect(stored).toBeTruthy();

    unmount();
    render(<AIChatModal isOpen={true} onClose={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('Reply 1')).toBeInTheDocument());
  });

  it('calls onClose when clicking the close button', async () => {
    const onClose = jest.fn();
    render(<AIChatModal isOpen={true} onClose={onClose} />);
    const closeBtn = document.querySelector('.ai-chat-close-btn') as HTMLElement;
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
