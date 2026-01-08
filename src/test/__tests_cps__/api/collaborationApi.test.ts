import { getCollaborationIndex } from "../../../api/collaborationApi";

const mockGet = jest.fn();

jest.mock("../../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
  },
}));

describe("collaborationApi", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("fetches collaboration index for board", async () => {
    const payload = {
      nodes: [],
      edges: [],
      graph: {},
      collaborationMetrics: [],
      summary: {
        totalUsers: 1,
        totalComments: 2,
        totalMentions: 3,
        totalMultiCollaboratorTasks: 4,
        averageCollaborationScore: 5,
        averageResponseTimeMinutes: 6,
      },
      groupAnalysis: {
        goodCollaborators: { count: 0, users: [] },
        poorCollaborators: { count: 0, users: [] },
      },
    };
    mockGet.mockResolvedValue({ data: { success: true, data: payload } });

    const res = await getCollaborationIndex("board-123");

    expect(mockGet).toHaveBeenCalledWith("/comments/board-123/Collaboration");
    expect(res).toEqual(payload);
  });
});
