import { rest } from 'msw';
const API = 'http://localhost:3005/api';

// Handlers related to group member operations
// Currently we only need getGroupUser to silence unhandled request warnings and provide predictable test data.
// Response shape mirrors usage in Sidebar.tsx and Groups.tsx: array of { group_id: {...}, role_in_group }
export const makeGroupMemberHandlers = () => [
  rest.post(`${API}/groupMember/getGroupUser`, async (req, res, ctx) => {
    // Optionally inspect body for id_user (not required for tests now)
    // const body = await req.json();
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          { group_id: { _id: 'g1', name: 'Alpha', description: 'Alpha Desc' }, role_in_group: 'Administrator' },
          { group_id: { _id: 'g2', name: 'Beta', description: 'Beta Desc' }, role_in_group: 'Người xem' },
        ],
      })
    );
  }),
];
