import { server } from "./msw.server";

// Use the global server from msw.server.ts which already includes analytics handlers

describe("msw analytics handlers", () => {
  it("returns health score data for a board", async () => {
    const res = await fetch("http://localhost:3005/analytics/HealthScore/board/board-123");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body?.success).toBe(true);
    expect(body?.data?.healthScore).toBe(42);
    expect(body?.boardId).toBe("board-123");
  });

  it("returns leaderboard data with query params applied", async () => {
    const res = await fetch("http://localhost:3005/analytics/leaderboard?center_id=c9&limit=10");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body?.data?.limit).toBe(10);
    expect(body?.data?.leaderboard?.[0]?.centerId).toBe("c9");
    expect(body?.data?.leaderboard?.[0]?.rank).toBe(1);
  });
});
