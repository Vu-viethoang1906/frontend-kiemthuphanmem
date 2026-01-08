import React from 'react';

interface CustomToastProps {
  title: string;
  message?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export const CustomToast: React.FC<CustomToastProps> = ({ 
  title, 
  message, 
  type = 'success' 
}) => {
  const icons = {
    success: (
      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="flex items-start gap-3 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[320px] max-w-md">
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {title}
        </p>
        {message && (
          <p className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// Helper functions to use with react-hot-toast
export const showSuccessToast = (title: string, message?: string) => {
  return <CustomToast title={title} message={message} type="success" />;
};

export const showErrorToast = (title: string, message?: string) => {
  return <CustomToast title={title} message={message} type="error" />;
};

export const showWarningToast = (title: string, message?: string) => {
  return <CustomToast title={title} message={message} type="warning" />;
};

export const showInfoToast = (title: string, message?: string) => {
  return <CustomToast title={title} message={message} type="info" />;
};
