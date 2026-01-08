import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[]; // Cần ít nhất 1 permission trong list
  requireAllPermissions?: string[]; // Cần tất cả permissions trong list
  fallback?: React.ReactNode; // Component hiển thị khi không có quyền
}

/**
 * Component bảo vệ route/content theo permissions
 * 
 * @example
 * // Cần ít nhất 1 trong các quyền USER_VIEW hoặc USER_CREATE
 * <ProtectedRoute requiredPermissions={['USER_VIEW', 'USER_CREATE']}>
 *   <UserManagement />
 * </ProtectedRoute>
 * 
 * @example
 * // Cần tất cả các quyền USER_VIEW, USER_CREATE, USER_UPDATE
 * <ProtectedRoute requireAllPermissions={['USER_VIEW', 'USER_CREATE', 'USER_UPDATE']}>
 *   <UserManagement />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requireAllPermissions = [],
  fallback = (
    <div className="p-6 text-center">
      <div className="inline-block p-8 bg-red-50 rounded-lg">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Access denied
        </h2>
        <p className="text-gray-600">
          You don't have permission to view this page. Please contact your administrator.
        </p>
      </div>
    </div>
  ),
}) => {
  const { hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Đang load permissions
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check permissions
  let hasAccess = true;

  if (requireAllPermissions.length > 0) {
    hasAccess = hasAllPermissions(requireAllPermissions);
  } else if (requiredPermissions.length > 0) {
    hasAccess = hasAnyPermission(requiredPermissions);
  }

  // Không có quyền → hiển thị fallback
  if (!hasAccess) {
    return <>{fallback}</>;
  }

  // Có quyền → hiển thị children
  return <>{children}</>;
};
