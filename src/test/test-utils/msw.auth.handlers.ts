import { rest } from 'msw';
const API = 'http://localhost:3005/api';
export const makeAuthHandlers = () => [
  rest.post(`${API}/login`, (_req, res, ctx) => res(ctx.status(200), ctx.json({ success: true, data: { token: 'mock', refreshToken: 'mockR' } }))),
  rest.get(`${API}/user/me`, (_req, res, ctx) => res(ctx.status(200), ctx.json({ success: true, data: { _id: 'u1', username: 'test' } }))),
];
