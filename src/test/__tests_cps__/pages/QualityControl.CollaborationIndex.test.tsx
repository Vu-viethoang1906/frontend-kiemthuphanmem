import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGetCollaborationIndex = jest.fn();
const mockFetchMyBoards = jest.fn();
const mockToast = { success: jest.fn(), error: jest.fn() };

jest.mock("../../../../src/api/collaborationApi", () => ({
  __esModule: true,
  getCollaborationIndex: (...args: any[]) => mockGetCollaborationIndex(...args),
}));

jest.mock("../../../../src/api/boardApi", () => ({
  __esModule: true,
  fetchMyBoards: (...args: any[]) => mockFetchMyBoards(...args),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: mockToast,
}));

jest.mock(
  "react-router-dom",
  () => ({
    __esModule: true,
    useSearchParams: () => {
      const params = new URLSearchParams();
      return [params, jest.fn()];
    },
  }),
  { virtual: true }
);

jest.mock("framer-motion", () => ({
  __esModule: true,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("CollaborationIndex page", () => {
  const boards = [
    { _id: "b1", title: "Board 1" },
    { _id: "b2", title: "Board 2" },
  ];
  const payload = {
    summary: {
      totalUsers: 2,
      totalComments: 3,
      totalMentions: 4,
      totalMultiCollaboratorTasks: 1,
      averageCollaborationScore: 75,
      averageResponseTimeMinutes: 8,
    },
    nodes: [],
    edges: [{ from: "u1", to: "u2" }],
    collaborationMetrics: [
      {
        userId: "u1",
        username: "u1",
        fullName: "User One",
        commentCount: 2,
        mentionCount: 1,
        averageResponseTimeMinutes: 5,
        collaborationScore: 80,
      },
      {
        userId: "u2",
        username: "u2",
        fullName: "User Two",
        commentCount: 1,
        mentionCount: 0,
        averageResponseTimeMinutes: 9,
        collaborationScore: 70,
      },
    ],
    groupAnalysis: {
      goodCollaborators: { count: 1, users: [{ userId: "u1" }] },
      poorCollaborators: { count: 1, users: [{ userId: "u2" }] },
    },
    summaryTrends: [],
    topMentions: [],
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchMyBoards.mockResolvedValue({ data: boards });
    mockGetCollaborationIndex.mockResolvedValue(payload);
  });

  const renderPage = async () => {
    const { default: Page } = await import("../../../../src/pages/QualityControl/CollaborationIndex");
    return render(<Page />);
  };

  it("loads boards, fetches data, and refreshes", async () => {
    await renderPage();

    expect(await screen.findByText(/Collaboration Index/i)).toBeInTheDocument();
    expect(mockFetchMyBoards).toHaveBeenCalled();
    expect(mockGetCollaborationIndex).toHaveBeenCalledWith("b1");

    // Summary numbers
    const usersLabel = await screen.findByText(/Total users/i);
    expect(within(usersLabel.parentElement as HTMLElement).getByText("2")).toBeInTheDocument();

    const commentsLabel = screen.getByText(/Total comments/i);
    expect(within(commentsLabel.parentElement as HTMLElement).getByText("3")).toBeInTheDocument();

    // Trigger manual refresh and board change
    await userEvent.selectOptions(screen.getByRole("combobox"), "b2");
    expect(mockGetCollaborationIndex).toHaveBeenLastCalledWith("b2");

    const refreshBtn = await screen.findByRole("button", { name: /Refresh/i });
    await userEvent.click(refreshBtn);
    expect(mockGetCollaborationIndex).toHaveBeenCalledWith("b2");
  });

  it("shows error state when fetch fails", async () => {
    mockGetCollaborationIndex.mockRejectedValueOnce(new Error("fail"));
    mockToast.error.mockClear();

    await renderPage();

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
