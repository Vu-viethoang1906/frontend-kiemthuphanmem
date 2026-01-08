import { rest } from 'msw';

export function makeAnalyticsHandlers() {
  const base = 'http://localhost:3005';

  return [
    // Board health score
    rest.get(`${base}/analytics/HealthScore/board/:boardId`, (req, res, ctx) => {
      const { boardId } = req.params as { boardId: string };
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            success: true,
            healthScore: 42,
            status: 'Red',
            recommendations: ['Increase on-time rate', 'Reduce cycle time'],
            metrics: {
              completionRate: 55,
              onTimeRate: 40,
              avgCycleTime: 12,
              dueDateCoverage: 60,
              assignmentCoverage: 70,
            },
          },
          boardId,
        })
      );
    }),

    // Leaderboard
    rest.get(`${base}/analytics/leaderboard`, (req, res, ctx) => {
      const center_id = req.url.searchParams.get('center_id') || null;
      const limit = Number(req.url.searchParams.get('limit') || '100');
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            leaderboard: [
              {
                rank: 1,
                userId: 'u1',
                username: 'alice',
                fullName: 'Alice',
                avatarUrl: null,
                centerId: center_id ?? 'c1',
                centerName: 'Center A',
                points: 1200,
                totalPoints: 1200,
                level: 25,
                statistics: {
                  tasksCompleted: 100,
                  onTimeCompleted: 80,
                  overdueCompleted: 20,
                  onTimeRate: 80,
                },
                pointsPerTaskRatio: 12,
              },
              {
                rank: 2,
                userId: 'u2',
                username: 'bob',
                fullName: 'Bob',
                avatarUrl: null,
                centerId: 'c2',
                centerName: 'Center B',
                points: 900,
                totalPoints: 900,
                level: 18,
                statistics: {
                  tasksCompleted: 90,
                  onTimeCompleted: 60,
                  overdueCompleted: 30,
                  onTimeRate: 66,
                },
                pointsPerTaskRatio: 10,
              },
            ],
            cheatDetection: {
              medianRatio: 10,
              thresholdRatio: 25,
              flaggedUsers: [],
              flaggedCount: 0,
            },
            summary: {
              totalUsers: 2,
              averagePoints: 1050,
              averageTasksCompleted: 95,
            },
            dateRange: null,
            limit,
          },
        })
      );
    }),
  ];
}
