import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import * as permsModule from '../../../hooks/usePermissions';

describe('ProtectedRoute (unit)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while checking permissions', () => {
    jest.spyOn(permsModule, 'usePermissions').mockReturnValue({
      permissions: [],
      loading: true,
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(),
      hasAllPermissions: jest.fn(),
    });

    render(
      <ProtectedRoute>
        <div>SECRET</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/Checking permissions/i)).toBeInTheDocument();
  });

  it('renders fallback when has no required permission (any)', () => {
    jest.spyOn(permsModule, 'usePermissions').mockReturnValue({
      permissions: [],
      loading: false,
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: jest.fn(),
    });

    render(
      <ProtectedRoute requiredPermissions={["USER_VIEW", "USER_CREATE"]}>
        <div>SECRET</div>
      </ProtectedRoute>
    );

    expect(
      screen.getByRole('heading', { name: /Access denied/i })
    ).toBeInTheDocument();
  });

  it('renders children when has any required permissions', () => {
    jest.spyOn(permsModule, 'usePermissions').mockReturnValue({
      permissions: ['USER_VIEW'],
      loading: false,
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(() => true),
      hasAllPermissions: jest.fn(),
    });

    render(
      <ProtectedRoute requiredPermissions={["USER_VIEW", "USER_CREATE"]}>
        <div>SECRET</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('SECRET')).toBeInTheDocument();
  });

  it('uses hasAllPermissions when requireAllPermissions provided', () => {
    const hasAll = jest.fn(() => true);
    jest.spyOn(permsModule, 'usePermissions').mockReturnValue({
      permissions: ['USER_VIEW', 'USER_CREATE'],
      loading: false,
      hasPermission: jest.fn(),
      hasAnyPermission: jest.fn(() => false),
      hasAllPermissions: hasAll,
    });

    render(
      <ProtectedRoute requireAllPermissions={["USER_VIEW", "USER_CREATE"]}>
        <div>ALL OK</div>
      </ProtectedRoute>
    );

    expect(hasAll).toHaveBeenCalledWith(["USER_VIEW", "USER_CREATE"]);
    expect(screen.getByText('ALL OK')).toBeInTheDocument();
  });
});
