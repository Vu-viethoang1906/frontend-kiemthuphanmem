import { getOverdueAnalysis } from "../../../api/overdueAnalysisApi";

const mockPost = jest.fn();

jest.mock("../../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    post: (...args: any[]) => mockPost(...args),
  },
}));

describe("overdueAnalysisApi", () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it("fetches overdue analysis for board", async () => {
    const payload = {
      totalOverdueTasks: 2,
      overdueTasks: [],
      breakdownByUser: [],
      breakdownByPriority: {
        high: { total: 1, avgDaysOverdue: 3 },
        medium: { total: 0, avgDaysOverdue: 0 },
        low: { total: 1, avgDaysOverdue: 1 },
        none: { total: 0, avgDaysOverdue: 0 },
      },
      breakdownByColumn: [],
      repeatOffenders: [],
      averageOverdueDays: 2,
    } as any;
    mockPost.mockResolvedValue({ data: { success: true, data: payload } });

    const res = await getOverdueAnalysis("board-123");

    expect(mockPost).toHaveBeenCalledWith("/analytics/Overdue_Analysis", { board_id: "board-123" });
    expect(res).toEqual(payload);
  });
});
