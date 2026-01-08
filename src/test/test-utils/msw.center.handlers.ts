import { rest } from 'msw';

export function makeCenterHandlers() {
  const base = 'http://localhost:3005';
  return [
    rest.get(`${base}/centers`, (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: [
            { _id: 'c1', name: 'Center A' },
            { _id: 'c2', name: 'Center B' },
          ],
        })
      );
    }),
  ];
}
