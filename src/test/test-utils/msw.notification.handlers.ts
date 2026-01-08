import { rest } from 'msw';

const API = 'http://localhost:3005/api';

// Simple in-memory notification store keyed by userId
type Notif = { _id: string; id?: string; created_at?: string; read_at?: string | null; body?: string; title?: string; type?: string; board_id?: string; task_id?: string };
const store: Record<string, Notif[]> = {};

export function __seedUserNotifications(userId: string, items: Notif[]) {
  store[userId] = items.map(n => ({ ...n }));
}

export const makeNotificationHandlers = () => [
  // List notifications for a user
  rest.get(`${API}/notification/:userId`, (req, res, ctx) => {
    const { userId } = req.params as { userId: string };
    const data = (store[userId] || []).map(n => ({
      _id: n._id || n.id || `${Math.random()}`,
      created_at: n.created_at || new Date().toISOString(),
      read_at: n.read_at ?? null,
      body: n.body || n.title || 'Thông báo',
      type: n.type || 'info',
      board_id: n.board_id,
      task_id: n.task_id,
    }));
    return res(ctx.status(200), ctx.json({ success: true, data }));
  }),

  // Mark a single notification as read
  rest.put(`${API}/notification/read/:id`, (req, res, ctx) => {
    const { id } = req.params as { id: string };
    const now = new Date().toISOString();
    // find and update in any user's list
    Object.values(store).forEach(list => {
      const idx = list.findIndex(n => (n._id || n.id) === id);
      if (idx >= 0) list[idx].read_at = now;
    });
    return res(ctx.status(200), ctx.json({ success: true }));
  }),

  // Delete a notification (used for clearing read)
  rest.delete(`${API}/notification/:id`, (req, res, ctx) => {
    const { id } = req.params as { id: string };
    Object.keys(store).forEach(uid => {
      store[uid] = (store[uid] || []).filter(n => (n._id || n.id) !== id);
    });
    return res(ctx.status(200), ctx.json({ success: true }));
  }),
];
