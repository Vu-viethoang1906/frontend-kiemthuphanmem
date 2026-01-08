import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock role & permission APIs used by the hook
jest.mock('../../../api/role&permission', () => ({
  getRolebyIdUser: jest.fn(),
  fetchAllRolePermission: jest.fn(),
}));

import { usePermissions } from '../../../hooks/usePermissions';
import * as rolePermissionApi from '../../../api/role&permission';

// Test component to expose hook state in the DOM
const HookProbe: React.FC = () => {
  const { permissions, loading, hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="permissions">{JSON.stringify(permissions)}</div>
      <div data-testid="has-comment-create">{String(hasPermission('comment:create'))}</div>
      <div data-testid="hasAny-a-b">{String(hasAnyPermission(['a', 'b']))}</div>
      <div data-testid="hasAll-a-b">{String(hasAllPermissions(['a', 'b']))}</div>
    </div>
  );
};

describe('hooks/usePermissions', () => {
  const originalGetItem = global.localStorage.getItem;
  const originalSetItem = global.localStorage.setItem;

  beforeEach(() => {
    jest.resetAllMocks();
    // default: empty roles and userId
    global.localStorage.setItem('roles', '[]');
    global.localStorage.setItem('userId', '');
  });

  afterAll(() => {
    // Restore localStorage just in case
    global.localStorage.getItem = originalGetItem.bind(global.localStorage);
    global.localStorage.setItem = originalSetItem.bind(global.localStorage);
  });

  it('grants wildcard for admin or System_Manager', async () => {
    // roles contains admin -> should short-circuit and set permissions to ['*']
    global.localStorage.setItem('roles', JSON.stringify(['admin']));

    render(<HookProbe />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    const perms = JSON.parse(screen.getByTestId('permissions').textContent || '[]');
    expect(perms).toEqual(['*']);
    // hasPermission/any/all should be true with wildcard
    expect(screen.getByTestId('has-comment-create').textContent).toBe('true');
    expect(screen.getByTestId('hasAny-a-b').textContent).toBe('true');
    expect(screen.getByTestId('hasAll-a-b').textContent).toBe('true');
    // No API calls should be needed
    expect(rolePermissionApi.getRolebyIdUser).not.toHaveBeenCalled();
    expect(rolePermissionApi.fetchAllRolePermission).not.toHaveBeenCalled();
  });

  it('returns empty permissions when no roles and no userId', async () => {
    // Local roles empty and no userId -> empty permissions
    global.localStorage.setItem('roles', '[]');
    global.localStorage.setItem('userId', '');

    render(<HookProbe />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    const perms = JSON.parse(screen.getByTestId('permissions').textContent || '[]');
    expect(perms).toEqual([]);
    // hasAny/hasAll should be false for non-empty arrays
    expect(screen.getByTestId('hasAny-a-b').textContent).toBe('false');
    expect(screen.getByTestId('hasAll-a-b').textContent).toBe('false');
  });

  it('computes permissions from API and supports hasAny/hasAll', async () => {
    // user with two roles
    global.localStorage.setItem('roles', JSON.stringify(['member']));
    global.localStorage.setItem('userId', 'user-1');

    // getRolebyIdUser returns list of role documents (with _id)
    (rolePermissionApi.getRolebyIdUser as jest.Mock).mockResolvedValue({
      data: [{ _id: 'r1' }, { _id: 'r2' }],
    });

    // fetchAllRolePermission returns mapping including the user's roles
    (rolePermissionApi.fetchAllRolePermission as jest.Mock).mockResolvedValue({
      data: [
        { role_id: { _id: 'r1' }, permission_id: { _id: 'p1', code: 'a' } },
        { role_id: { _id: 'r1' }, permission_id: { _id: 'p2', code: 'b' } },
        { role_id: { _id: 'r3' }, permission_id: { _id: 'p3', code: 'c' } }, // not in user roles
      ],
    });

    render(<HookProbe />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    const perms = JSON.parse(screen.getByTestId('permissions').textContent || '[]');
    expect(new Set(perms)).toEqual(new Set(['a', 'b']));

    // Check helpers
    expect(screen.getByTestId('has-comment-create').textContent).toBe('false');
    expect(screen.getByTestId('hasAny-a-b').textContent).toBe('true');
    expect(screen.getByTestId('hasAll-a-b').textContent).toBe('true');
  });
});
