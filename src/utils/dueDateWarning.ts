/**
 * Utility functions for due date warning calculations
 */

export type DueDateWarningStatus = 'overdue' | 'warning' | 'ok' | null;

export interface DueDateWarningInfo {
  status: DueDateWarningStatus;
  hoursRemaining: number | null;
  daysRemaining: number | null;
  message: string;
}

/**
 * Calculate due date warning status
 * @param dueDate - ISO date string or Date object
 * @returns Warning info with status, time remaining, and message
 */
export function getDueDateWarning(dueDate?: string | Date | null): DueDateWarningInfo {
  if (!dueDate) {
    return {
      status: null,
      hoursRemaining: null,
      daysRemaining: null,
      message: '',
    };
  }

  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Task đã quá hạn
  if (diffMs < 0) {
    const hoursOverdue = Math.abs(diffHours);
    const daysOverdue = Math.abs(diffDays);
    
    if (daysOverdue > 0) {
      return {
        status: 'overdue',
        hoursRemaining: -hoursOverdue,
        daysRemaining: -daysOverdue,
        message: `Quá hạn ${daysOverdue} ngày`,
      };
    } else {
      return {
        status: 'overdue',
        hoursRemaining: -hoursOverdue,
        daysRemaining: 0,
        message: `Quá hạn ${hoursOverdue} giờ`,
      };
    }
  }

  // Task sắp đến hạn (trong 24 giờ)
  if (diffHours <= 24) {
    if (diffHours <= 0) {
      return {
        status: 'warning',
        hoursRemaining: 0,
        daysRemaining: 0,
        message: 'Sắp đến hạn',
      };
    }
    return {
      status: 'warning',
      hoursRemaining: diffHours,
      daysRemaining: 0,
      message: `Còn ${diffHours} giờ`,
    };
  }

  // Task còn nhiều thời gian
  return {
    status: 'ok',
    hoursRemaining: diffHours,
    daysRemaining: diffDays,
    message: diffDays > 0 ? `Còn ${diffDays} ngày` : `Còn ${diffHours} giờ`,
  };
}

/**
 * Get warning icon color class based on status
 */
export function getWarningIconColor(status: DueDateWarningStatus): string {
  switch (status) {
    case 'overdue':
      return 'text-red-500';
    case 'warning':
      return 'text-yellow-500';
    case 'ok':
      return 'text-green-500';
    default:
      return 'text-gray-400';
  }
}
