import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkStatus: React.FC = () => {
  const isOnline = useNetworkStatus();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // Show offline alert immediately
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
    } else {
      // Hide offline alert and show online alert briefly
      setShowOfflineAlert(false);
      
      // Only show "back online" message if we were previously offline
      if (showOfflineAlert) {
        setShowOnlineAlert(true);
        // Auto-hide online alert after 3 seconds
        const timer = setTimeout(() => {
          setShowOnlineAlert(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline]);

  // Don't render anything if online and no alerts to show
  if (isOnline && !showOnlineAlert) {
    return null;
  }

  return (
    <>
      {/* Offline Alert - Persistent */}
      {showOfflineAlert && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white px-4 py-3 shadow-lg animate-slide-down">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg 
                className="w-6 h-6 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" 
                />
              </svg>
              <div>
                <p className="font-semibold text-sm sm:text-base">No Internet Connection</p>
                <p className="text-xs sm:text-sm opacity-90">Please check your network connection and try again.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs font-medium hidden sm:inline">Offline</span>
            </div>
          </div>
        </div>
      )}

      {/* Online Alert - Temporary */}
      {showOnlineAlert && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-green-600 text-white px-4 py-3 shadow-lg animate-slide-down">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg 
                className="w-6 h-6 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div>
                <p className="font-semibold text-sm sm:text-base">Connection Restored</p>
                <p className="text-xs sm:text-sm opacity-90">You're back online!</p>
              </div>
            </div>
            <button
              onClick={() => setShowOnlineAlert(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default NetworkStatus;
