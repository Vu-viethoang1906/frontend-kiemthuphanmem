import { rest } from 'msw';

const API = 'http://localhost:3005/api';

export const makeSwimlaneHandlers = () => [
  // Reorder swimlanes
  rest.put(`${API}/swimlanes/board/:boardId/reorder`, async (req, res, ctx) => {
    const { boardId } = req.params as { boardId: string };
    try {
      const body = await req.json();
      const { swimlane_ids } = body as { swimlane_ids: string[] };
      return res(
        ctx.status(200),
        ctx.json({ success: true, data: { boardId, ids: swimlane_ids } })
      );
    } catch (e) {
      return res(ctx.status(400), ctx.json({ success: false, error: 'Bad payload' }));
    }
  }),
];
