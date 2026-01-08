import { rest } from 'msw';
const API = 'http://localhost:3005/api';
export const makeBoardHandlers = () => [
  rest.get(`${API}/boards`, (_req, res, ctx) => res(ctx.status(200), ctx.json({ success: true, data: [] }))),
  // Return list of boards owned by current user (used by dashboard/admin tests)
  rest.get(`${API}/boards/my`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          { _id: 'b1', name: 'My Board 1', title: 'My Board 1', owner_id: 'u1' },
          { _id: 'b2', name: 'My Board 2', title: 'My Board 2', owner_id: 'u1' }
        ]
      })
    );
  }),
];
