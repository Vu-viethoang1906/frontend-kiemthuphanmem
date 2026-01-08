import {
  getAdaptiveGamificationDashboard,
  trackBehavior,
  analyzeBehavior,
  getMotivationProfile,
  updateMotivationProfile,
  getPersonalizedGamification,
  getBehaviorAnalytics,
  getBehaviorStats,
  adjustRewards,
} from "../../../api/adaptiveGamificationApi";

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();

jest.mock("../../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

describe("adaptiveGamificationApi", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
  });

  it("gets dashboard with params", async () => {
    const payload = { motivation_profile: { competitive_score: 1 } } as any;
    mockGet.mockResolvedValue({ data: { success: true, data: payload } });

    const data = await getAdaptiveGamificationDashboard("center-1", 7, 5);

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringMatching(/adaptive-gamification\?center_id=center-1&days=7&recent_limit=5/)
    );
    expect(data).toEqual(payload);
  });

  it("tracks behavior with metadata", async () => {
    mockGet.mockResolvedValue({ data: {} });
    await trackBehavior("c1", "view", "button", { foo: "bar" });

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringMatching(/center_id=c1.*action_type=view.*element_type=button.*metadata=%7B%22foo%22%3A%22bar%22%7D/)
    );
  });

  it("analyzes behavior and returns profile", async () => {
    const profile = { competitive_score: 2 } as any;
    mockGet.mockResolvedValue({ data: { success: true, data: profile } });

    const res = await analyzeBehavior("c1", "u1");

    expect(mockGet).toHaveBeenCalledWith(
      expect.stringMatching(/analyze\?center_id=c1&user_id=u1/)
    );
    expect(res).toEqual(profile);
  });

  it("gets and updates motivation profile", async () => {
    const profile = { collaborative_score: 3 } as any;
    mockGet.mockResolvedValueOnce({ data: { success: true, data: profile } });
    const fetched = await getMotivationProfile("c1");
    expect(mockGet).toHaveBeenCalledWith(expect.stringMatching(/profile\?center_id=c1/));
    expect(fetched).toEqual(profile);

    const updated = { long_term_score: 4 } as any;
    mockPut.mockResolvedValueOnce({ data: { success: true, data: updated } });
    const res = await updateMotivationProfile("c1");
    expect(mockPut).toHaveBeenCalledWith(expect.stringMatching(/profile\?center_id=c1/));
    expect(res).toEqual(updated);
  });

  it("gets personalized gamification", async () => {
    const payload = { motivation_profile: {}, personalization: {} } as any;
    mockGet.mockResolvedValue({ data: { success: true, data: payload } });

    const res = await getPersonalizedGamification("c1");
    expect(mockGet).toHaveBeenCalledWith(expect.stringMatching(/personalized\?center_id=c1/));
    expect(res).toEqual(payload);
  });

  it("gets behavior analytics and stats", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: { total_events: 10 } } });
    const analytics = await getBehaviorAnalytics("c1", 14);
    expect(mockGet).toHaveBeenCalledWith(expect.stringMatching(/behavior\/analytics\?center_id=c1&period=14/));
    expect(analytics).toEqual({ total_events: 10 });

    mockGet.mockResolvedValueOnce({ data: { success: true, data: { leaderboard_views: 2 } } });
    const stats = await getBehaviorStats("c1", 21);
    expect(mockGet).toHaveBeenCalledWith(expect.stringMatching(/behavior\/stats\?center_id=c1&days=21/));
    expect(stats).toEqual({ leaderboard_views: 2 });
  });

  it("adjusts rewards", async () => {
    mockPost.mockResolvedValue({ data: { data: { ok: true } } });
    const res = await adjustRewards("c1", "BOOST_POINTS");
    expect(mockPost).toHaveBeenCalledWith(
      "/adaptive-gamification/adjust-rewards",
      { center_id: "c1", action: "BOOST_POINTS" }
    );
    expect(res).toEqual({ ok: true });
  });
});
