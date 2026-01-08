import React from 'react';
import { render, screen, fireEvent, act, within, waitFor } from '@testing-library/react';
// Mock react-router-dom before importing component to avoid ESM resolution
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}), { virtual: true });

import NotificationBell from '../../../components/NotificationBell';
import { __seedUserNotifications } from '../../test-utils/msw.notification.handlers';

// Mock socket minimal API used
jest.mock('../../../socket', () => ({
  socket: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// No need to mock react-router-dom; MemoryRouter provides context

describe('NotificationBell (unit)', () => {
  beforeEach(() => {
    localStorage.setItem('userId', 'u1');
    jest.useFakeTimers();
    // silence expected console noise from internal logs
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    (console.log as jest.Mock).mockRestore?.();
    (console.error as jest.Mock).mockRestore?.();
  });

  it('renders button and toggles dropdown open/close', async () => {
    render(<NotificationBell />);

  const button = screen.getByLabelText(/Notifications/i);
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(await screen.findByText('Notifications')).toBeInTheDocument();

    // click again to close
    fireEvent.click(button);
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('shows unread badge when unreadCount > 0', async () => {
    // Seed one unread notification via MSW
    __seedUserNotifications('u1', [
      { _id: 'n1', created_at: new Date().toISOString(), read_at: null, body: 'New notification' },
    ]);

    render(<NotificationBell />);

    // flush useEffect loadNotifications
    await act(async () => {});

    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('marks all notifications as read via header action and updates UI', async () => {
    // initial load: two unread
    __seedUserNotifications('u1', [
      { _id: 'n1', created_at: new Date().toISOString(), read_at: null, body: 'N1' },
      { _id: 'n2', created_at: new Date().toISOString(), read_at: null, body: 'N2' },
    ]);

    render(<NotificationBell />);
    await act(async () => {});

    // open dropdown
  const bellButton = screen.getByLabelText(/Notifications/i);
    fireEvent.click(bellButton);
    expect(await screen.findByText('Notifications')).toBeInTheDocument();

    // click "Mark all as read" to mark all as read
    const markAllBtn = await screen.findByRole('button', { name: /Mark all as read/i });
    fireEvent.click(markAllBtn);

    // After marking all as read, the bell badge should disappear
    await waitFor(() => {
      expect(within(bellButton).queryByText('2')).toBeNull();
    });
    // Switch to tab Read to ensure items moved
  const readTabBtn = screen.getByRole('button', { name: /^Read/i });
    fireEvent.click(readTabBtn);
    // Count element for read tab shows 2 (scoped within tab button)
    expect(within(readTabBtn).getByText('2')).toBeInTheDocument();
  });

  it('tab switching reflects unread/read lists and allows item click to mark as read', async () => {
    __seedUserNotifications('u1', [
      { _id: 'n1', created_at: new Date().toISOString(), read_at: null, body: 'New notification' },
      { _id: 'n2', created_at: new Date().toISOString(), read_at: new Date().toISOString(), body: 'Already read' },
    ]);

    render(<NotificationBell />);
    await act(async () => {});

    // open dropdown
  const bellButton = screen.getByLabelText(/Notifications/i);
    fireEvent.click(bellButton);
    expect(await screen.findByText('Notifications')).toBeInTheDocument();

    // unread badge shows 1 (scoped within bell button)
    expect(within(bellButton).getByText('1')).toBeInTheDocument();

    // Switch to read tab; count "1"
  const readTabBtn = screen.getByRole('button', { name: /^Read/i });
    fireEvent.click(readTabBtn);
    expect(within(readTabBtn).getByText('1')).toBeInTheDocument();

    // Back to unread, click the unread item to trigger delayed mark-as-read
    const unreadTabBtn = screen.getByRole("button", { name: /Unread\b/i });
    fireEvent.click(unreadTabBtn);
    const unreadItem = await screen.findByText('New notification');
    fireEvent.click(unreadItem);
    // advance timers to pass 250ms delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    // bell badge should disappear
    await waitFor(() => {
      expect(within(bellButton).queryByText('1')).toBeNull();
    });
  });

  it('clears all read notifications when clicking Clear all', async () => {
    // Seed: 2 read, 1 unread
    __seedUserNotifications('u1', [
      { _id: 'r1', created_at: new Date().toISOString(), read_at: new Date().toISOString(), body: 'Already read 1' },
      { _id: 'r2', created_at: new Date().toISOString(), read_at: new Date().toISOString(), body: 'Already read 2' },
      { _id: 'u1n', created_at: new Date().toISOString(), read_at: null, body: 'Not yet read' },
    ]);

    render(<NotificationBell />);
    await act(async () => {});

    // open dropdown
  const bellButton = screen.getByLabelText(/Notifications/i);
    fireEvent.click(bellButton);
    expect(await screen.findByText('Notifications')).toBeInTheDocument();

    // switch to read tab and verify count 2
  const readTabBtn = screen.getByRole('button', { name: /^Read/i });
    fireEvent.click(readTabBtn);
    expect(within(readTabBtn).getByText('2')).toBeInTheDocument();

    // click clear all
    const clearAllBtn = await screen.findByRole('button', { name: /Clear all/i });
    fireEvent.click(clearAllBtn);

    // read tab should now show empty state and count removed
    await waitFor(() => {
      expect(within(readTabBtn).queryByText('2')).toBeNull();
      expect(screen.getByText('No read notifications')).toBeInTheDocument();
    });

    // Unread badge should still show 1 (the unread item remains)
    expect(within(bellButton).getByText('1')).toBeInTheDocument();
  });
});
