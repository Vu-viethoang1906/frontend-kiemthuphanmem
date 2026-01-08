import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';

describe('useNetworkStatus', () => {
  let onlineListener: ((event: Event) => void) | null = null;
  let offlineListener: ((event: Event) => void) | null = null;

  beforeEach(() => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    // Mock addEventListener to capture listeners
    const originalAddEventListener = window.addEventListener;
    jest.spyOn(window, 'addEventListener').mockImplementation((event, listener) => {
      if (event === 'online') {
        onlineListener = listener as (event: Event) => void;
      } else if (event === 'offline') {
        offlineListener = listener as (event: Event) => void;
      }
      originalAddEventListener.call(window, event, listener as EventListener);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    onlineListener = null;
    offlineListener = null;
  });

  it('should return true when initially online', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);
  });

  it('should return false when initially offline', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(false);
  });

  it('should update to false when connection is lost', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(true);

    act(() => {
      if (offlineListener) {
        offlineListener(new Event('offline'));
      }
    });

    expect(result.current).toBe(false);
  });

  it('should update to true when connection is restored', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current).toBe(false);

    act(() => {
      if (onlineListener) {
        onlineListener(new Event('online'));
      }
    });

    expect(result.current).toBe(true);
  });

  it('should remove event listeners on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
