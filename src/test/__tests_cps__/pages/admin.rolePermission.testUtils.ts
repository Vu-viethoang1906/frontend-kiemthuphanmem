// Minimal deterministic datasets for Role & Permission matrix tests
// Keep purely data-focused; tests assert only user-visible outcomes per README guidelines.

export interface TestRole { _id: string; name: string }
export interface TestPermission { _id: string; code: string; typePermission?: string }
export interface RolePermissionMapping { role_id: string; permission_id: string }

export const baseRoles: TestRole[] = [
  { _id: 'r1', name: 'Manager' }
];

export const basePermissions: TestPermission[] = [
  { _id: 'p1', code: 'EDIT_TASK', typePermission: 'Task' },
  { _id: 'p2', code: 'VIEW_TASK', typePermission: 'Task' }
];

// Scenario A: Only VIEW_TASK assigned.
export const mappingScenarioA: RolePermissionMapping[] = [
  { role_id: 'r1', permission_id: 'p2' }
];

// Utility to build mock return objects matching production expectations
export function buildMockResponse<T>(data: T): any { return { data }; }
