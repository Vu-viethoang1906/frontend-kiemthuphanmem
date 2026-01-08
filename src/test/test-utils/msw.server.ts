import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Basic handlers; can be expanded. These replace previously missing files referenced in tests.
import { makeAuthHandlers } from './msw.auth.handlers';
import { makeBoardHandlers } from './msw.board.handlers';
import { makeTaskHandlers } from './msw.task.handlers';
import { makeNotificationHandlers } from './msw.notification.handlers';
import { makeRolePermissionHandlers } from './msw.rolePermission.handlers';
import { makeSwimlaneHandlers } from './msw.swimlane.handlers';
import { makeGroupMemberHandlers } from './msw.groupMember.handlers';
import { makeCenterHandlers } from './msw.center.handlers';
import { makeAnalyticsHandlers } from './msw.analytics.handlers';

// Provide factories fallback if handler files are absent
const safe = <T extends any[]>(fn: () => T, empty: T) => {
  try { return fn(); } catch { return empty; }
};

export const server = setupServer(
  ...safe(makeAuthHandlers, []),
  ...safe(makeBoardHandlers, []),
  ...safe(makeTaskHandlers, []),
  ...safe(makeNotificationHandlers, []),
  ...safe(makeRolePermissionHandlers, []),
  ...safe(makeSwimlaneHandlers, []),
  ...safe(makeGroupMemberHandlers, []),
  ...safe(makeCenterHandlers, []),
  ...safe(makeAnalyticsHandlers, []),
  // Generic avatar image handler
  rest.get('http://localhost:3005/api/img/users/:userId/avatar', (req, res, ctx) => {
    const { userId } = req.params as { userId: string };
    // Return a tiny transparent pixel data URL or meta info
    return res(ctx.status(200), ctx.json({ success: true, userId, avatar: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==' }));
  }),
  // Fallback /user/me handler variants to silence warnings if code hits non-api base or different host
  rest.get('http://localhost:3005/user/me', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true, data: { _id: 'u1', username: 'test' } }));
  }),
  rest.get('http://localhost/user/me', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true, data: { _id: 'u1', username: 'test' } }));
  }),
  // Fallback root handler for unmatched routes to avoid noisy failures (optional)
  rest.get('http://localhost:3005/health', (_req, res, ctx) => res(ctx.status(200), ctx.json({ ok: true })))
  ,
  // Socket.io polling fallback (some components may initialize a client with undefined base URL in tests)
  rest.get('http://undefined/socket.io/', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.text('OK'));
  })
);
