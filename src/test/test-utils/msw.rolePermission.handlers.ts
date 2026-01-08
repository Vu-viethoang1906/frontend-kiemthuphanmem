import { rest } from 'msw';

// Base API URL matching axiosInstance baseURL
const API = 'http://localhost:3005/api';

// In‑memory stores to simulate backend state during test run.
// They are module‑scoped so they persist across handler calls until resetHandlers() is invoked.
let __permissions: Array<{ id: string; name: string }> = [
  { id: 'p1', name: 'READ' },
  { id: 'p2', name: 'WRITE' },
];
let __rolePermissions: Array<{ roleId: string; permissionIds: string[] }> = [
  { roleId: 'r1', permissionIds: ['p1'] },
];
let __userRoles: Array<{ user_id: string; role_id: string }> = [
  { user_id: 'user-1', role_id: 'r1' },
];

// Helper to update role permissions
const updateRolePermission = (roleId: string, permissionIds: string[]) => {
  const existing = __rolePermissions.find(rp => rp.roleId === roleId);
  if (existing) {
    existing.permissionIds = permissionIds;
  } else {
    __rolePermissions.push({ roleId, permissionIds });
  }
  return existing || __rolePermissions.find(rp => rp.roleId === roleId)!;
};

// Exported seed utilities (optional future usage)
export const __seedUserRoles = (rows: Array<{ user_id: string; role_id: string }>) => {
  __userRoles = rows.slice();
};
export const __seedRolePermissions = (rows: Array<{ roleId: string; permissionIds: string[] }>) => {
  __rolePermissions = rows.slice();
};
export const __seedPermissions = (rows: Array<{ id: string; name: string }>) => {
  __permissions = rows.slice();
};

export const makeRolePermissionHandlers = () => [
  // Permissions list
  rest.get(`${API}/permission`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true, data: __permissions }));
  }),
  // RolePermission mappings list
  rest.get(`${API}/RolePermission`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true, data: __rolePermissions }));
  }),
  // Update role permissions
  rest.put(`${API}/RolePermission/RolePermission`, async (req, res, ctx) => {
    try {
      const body = await req.json();
      const { currentUserId, permissions } = body as { currentUserId: string; permissions: string[] };
      // For tests we always operate on role 'r1' regardless of currentUserId
      const updated = updateRolePermission('r1', permissions);
      return res(
        ctx.status(200),
        ctx.json({ success: true, data: [updated], actor: currentUserId })
      );
    } catch (e) {
      return res(ctx.status(400), ctx.json({ success: false, error: 'Bad payload' }));
    }
  }),
  // Fetch all userRole mappings
  rest.get(`${API}/userRole`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true, data: __userRoles }));
  }),
  // Create userRole mapping
  rest.post(`${API}/userRole`, async (req, res, ctx) => {
    const body = await req.json();
    const { user_id, role_id } = body as { user_id: string; role_id: string };
    __userRoles.push({ user_id, role_id });
    return res(ctx.status(200), ctx.json({ success: true, data: { user_id, role_id } }));
  }),
  // Delete all roles of user
  rest.delete(`${API}/userRole/user/:userId`, (req, res, ctx) => {
    const { userId } = req.params as { userId: string };
    __userRoles = __userRoles.filter(r => r.user_id !== userId);
    return res(ctx.status(200), ctx.json({ success: true }));
  }),
  // Get roles by user id
  rest.get(`${API}/userRole/user/:userId`, (req, res, ctx) => {
    const { userId } = req.params as { userId: string };
    const rows = __userRoles.filter(r => r.user_id === userId);
    return res(ctx.status(200), ctx.json({ success: true, data: rows }));
  }),
];

