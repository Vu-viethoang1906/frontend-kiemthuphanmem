import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NetworkStatus from '../../../components/NetworkStatus';

// Mock the useNetworkStatus hook
const mockUseNetworkStatus = jest.fn();
jest.mock('../../../hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

describe('NetworkStatus component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should not render when online initially', () => {
    mockUseNetworkStatus.mockReturnValue(true);
    const { container } = render(<NetworkStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('should show offline alert when connection is lost', () => {
    mockUseNetworkStatus.mockReturnValue(false);
    render(<NetworkStatus />);
    
    expect(screen.getByText(/No Internet Connection/i)).toBeInTheDocument();
  });

  it('should show online alert when connection is restored after being offline', async () => {
    // Start offline
    mockUseNetworkStatus.mockReturnValue(false);
    const { rerender } = render(<NetworkStatus />);
    
    expect(screen.getByText(/No Internet Connection/i)).toBeInTheDocument();

    // Go back online
    mockUseNetworkStatus.mockReturnValue(true);
    rerender(<NetworkStatus />);

    expect(screen.getByText(/Connection restored/i)).toBeInTheDocument();
  });

  it('should auto-hide online alert after 3 seconds', async () => {
    // Start offline
    mockUseNetworkStatus.mockReturnValue(false);
    const { rerender } = render(<NetworkStatus />);
    
    // Go back online
    mockUseNetworkStatus.mockReturnValue(true);
    rerender(<NetworkStatus />);

    expect(screen.getByText(/Connection restored/i)).toBeInTheDocument();

    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(screen.queryByText(/Connection restored/i)).not.toBeInTheDocument();
    });
  });

  it('should not show online alert when going online without being offline first', () => {
    mockUseNetworkStatus.mockReturnValue(true);
    render(<NetworkStatus />);

    // Should not show any alert
    expect(screen.queryByText(/Connection restored/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No Internet Connection/i)).not.toBeInTheDocument();
  });

  it('should persist offline alert while offline', () => {
    mockUseNetworkStatus.mockReturnValue(false);
    const { rerender } = render(<NetworkStatus />);
    
    expect(screen.getByText(/No Internet Connection/i)).toBeInTheDocument();

    // Re-render (simulating state update)
    rerender(<NetworkStatus />);
    
    // Alert should still be visible
    expect(screen.getByText(/No Internet Connection/i)).toBeInTheDocument();
  });
});
