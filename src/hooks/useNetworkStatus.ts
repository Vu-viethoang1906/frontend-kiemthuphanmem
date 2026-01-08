import { useState, useEffect } from 'react';

/**
 * Hook to monitor network connection status
 * Returns true if online, false if offline
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    // Handler for when connection is restored
    const handleOnline = () => {
      setIsOnline(true);
    };

    // Handler for when connection is lost
    const handleOffline = () => {
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
