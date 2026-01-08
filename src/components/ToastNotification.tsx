import React, { useEffect } from 'react';
import '../styles/ToastNotification.css';

interface ToastNotificationProps {
  message: string;
  description?: string;
  onClose: () => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ 
  message, 
  description, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-notification">
      <div className="toast-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill="#14b8a6"/>
          <path 
            d="M6 10L9 13L14 7" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="toast-content">
        <div className="toast-message">{message}</div>
        {description && <div className="toast-description">{description}</div>}
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export default ToastNotification;