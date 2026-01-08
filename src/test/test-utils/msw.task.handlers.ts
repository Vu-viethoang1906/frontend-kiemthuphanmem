import { rest } from 'msw';
const API = 'http://localhost:3005/api';
export const makeTaskHandlers = () => [
  rest.get(`${API}/tasks`, (_req, res, ctx) => res(ctx.status(200), ctx.json({ success: true, data: [] }))),
];
