import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NetworkStatus from '../../../components/NetworkStatus';

// Mock hook so we can control online/offline state transitions
jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => true)
}));
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

function setOnlineState(isOnline: boolean) {
  (useNetworkStatus as jest.Mock).mockReturnValue(isOnline);
}

describe('components/NetworkStatus behavior', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setOnlineState(true);
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders nothing when online and no transient alert', () => {
    render(<NetworkStatus />);
    expect(screen.queryByText(/No Internet Connection/i)).toBeNull();
    expect(screen.queryByText(/Connection Restored/i)).toBeNull();
  });

  it('shows persistent offline alert immediately when offline', () => {
    setOnlineState(false);
    render(<NetworkStatus />);
    expect(screen.getByText(/No Internet Connection/i)).toBeInTheDocument();
    expect(screen.getByText(/Offline/i)).toBeInTheDocument();
  });

  it('switches from offline to online and shows temporary restored alert then auto-hides', () => {
    // Start offline
    setOnlineState(false);
    const { rerender } = render(<NetworkStatus />);
    expect(screen.getByText(/No Internet Connection/i)).toBeInTheDocument();

    // Go online - simulate previous offline state triggers restored alert
    setOnlineState(true);
    rerender(<NetworkStatus />);
    expect(screen.queryByText(/No Internet Connection/i)).toBeNull();
    expect(screen.getByText(/Connection Restored/i)).toBeInTheDocument();
    expect(screen.getByText(/You're back online!/i)).toBeInTheDocument();

    // Auto hide after 3s
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.queryByText(/Connection Restored/i)).toBeNull();
  });

  it('allows manual dismiss of online restored alert', () => {
    setOnlineState(false);
    const { rerender } = render(<NetworkStatus />);
    setOnlineState(true);
    rerender(<NetworkStatus />);
    const closeBtn = screen.getByRole('button', { name: /Close/i });
    userEvent.click(closeBtn);
    expect(screen.queryByText(/Connection Restored/i)).toBeNull();
  });
});