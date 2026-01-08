/**
 * Định nghĩa các permissions trong hệ thống
 * Giúp dễ dàng quản lý và tránh typo
 */

export const PERMISSIONS = {
  // General
  VIEW_ALL: 'VIEW_ALL', // 🔥 Permission xem tất cả
  
  // User Management
  USER_VIEW: 'USER_VIEW',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  
  // Group Management
  GROUP_VIEW: 'GROUP_VIEW',
  GROUP_CREATE: 'GROUP_CREATE',
  GROUP_UPDATE: 'GROUP_UPDATE',
  GROUP_DELETE: 'GROUP_DELETE',
  
  // Board Management
  BOARD_VIEW: 'BOARD_VIEW',
  BOARD_CREATE: 'BOARD_CREATE',
  BOARD_UPDATE: 'BOARD_UPDATE',
  BOARD_DELETE: 'BOARD_DELETE',
  
  // Task Management
  TASK_VIEW: 'TASK_VIEW',
  TASK_CREATE: 'TASK_CREATE',
  TASK_UPDATE: 'TASK_UPDATE',
  TASK_DELETE: 'TASK_DELETE',
  
  // Tag Management
  TAG_VIEW: 'TAG_VIEW',
  TAG_CREATE: 'TAG_CREATE',
  TAG_UPDATE: 'TAG_UPDATE',
  TAG_DELETE: 'TAG_DELETE',
  
  // Report
  REPORT_VIEW: 'REPORT_VIEW',
  REPORT_CREATE: 'REPORT_CREATE',
  REPORT_UPDATE: 'REPORT_UPDATE',
  REPORT_DELETE: 'REPORT_DELETE',
} as const;

/**
 * Định nghĩa permissions cần thiết cho từng trang/chức năng
 */
export const PAGE_PERMISSIONS: Record<string, string[]> = {
  // UserManagement cần ít nhất 1 trong các quyền USER
  USER_MANAGEMENT: [
    'VIEW_ALL', // 🔥 Thêm VIEW_ALL cho role Student
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
  ],
  
  // RoleAndPermission - chỉ admin mới có quyền này
  ROLE_PERMISSION: ['ROLE_VIEW', 'ROLE_CREATE', 'ROLE_UPDATE', 'ROLE_DELETE'],
  
  // Templates
  TEMPLATES: ['TEMPLATE_VIEW', 'TEMPLATE_CREATE', 'TEMPLATE_UPDATE', 'TEMPLATE_DELETE'],
  
  // Centers
  CENTERS: ['CENTER_VIEW', 'CENTER_CREATE', 'CENTER_UPDATE', 'CENTER_DELETE'],

  // Centers - Admin only access (wildcard '*' in usePermissions will pass)
  CENTER_ADMIN_ONLY: ['__ADMIN_ONLY__'],
  
  // User Points
  USER_POINTS: ['POINT_VIEW', 'POINT_UPDATE'],
};
