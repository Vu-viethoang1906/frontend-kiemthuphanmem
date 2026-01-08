import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGetOverdueAnalysis = jest.fn();
const mockFetchMyBoards = jest.fn();
const mockToast = { success: jest.fn(), error: jest.fn() };

jest.mock("../../../../src/api/overdueAnalysisApi", () => ({
  __esModule: true,
  getOverdueAnalysis: (...args: any[]) => mockGetOverdueAnalysis(...args),
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

describe("OverdueAnalysis page", () => {
  const boards = [
    { _id: "b1", title: "Board 1" },
    { _id: "b2", title: "Board 2" },
  ];
  const payload = {
    totalOverdueTasks: 4,
    averageOverdueDays: 2.5,
    breakdownByUser: [
      { userId: "u1", username: "u1", fullName: "User One", email: "", violationCount: 2, avgDaysOverdue: 3 },
    ],
    breakdownByPriority: {
      high: { total: 2, avgDaysOverdue: 3 },
      medium: { total: 1, avgDaysOverdue: 2 },
      low: { total: 1, avgDaysOverdue: 1 },
      none: { total: 0, avgDaysOverdue: 0 },
    },
    breakdownByColumn: [
      { columnId: "c1", columnName: "Todo", total: 2, avgDaysOverdue: 2 },
    ],
    repeatOffenders: [
      { userId: "u1", username: "u1", fullName: "User One", email: "" },
    ],
    overdueTasks: [
      { taskId: "t1", title: "Task 1", dueDate: "2023-01-01", priority: "high", columnId: "c1", columnName: "Todo", assignedTo: null, daysOverdue: 5 },
    ],
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchMyBoards.mockResolvedValue({ data: boards });
    mockGetOverdueAnalysis.mockResolvedValue(payload);
  });

  const renderPage = async () => {
    const { default: Page } = await import("../../../../src/pages/QualityControl/OverdueAnalysis");
    return render(<Page />);
  };

  it("loads analysis data, shows summary, and refreshes", async () => {
    await renderPage();

    expect(await screen.findByText(/Overdue Analysis/i)).toBeInTheDocument();
    expect(mockFetchMyBoards).toHaveBeenCalled();
    expect(mockGetOverdueAnalysis).toHaveBeenCalledWith("b1");

    const totalCard = await screen.findByText(/Total overdue tasks/i);
    expect(within(totalCard.parentElement as HTMLElement).getByText("4")).toBeInTheDocument();

    const avgCardLabel = screen.getAllByText(/Average days overdue/i)[0];
    expect(within(avgCardLabel.parentElement as HTMLElement).getByText("2.5")).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByRole("combobox"), "b2");
    expect(mockGetOverdueAnalysis).toHaveBeenLastCalledWith("b2");

    const refreshBtn = await screen.findByRole("button", { name: /Refresh/i });
    await userEvent.click(refreshBtn);
    expect(mockGetOverdueAnalysis).toHaveBeenCalledWith("b2");
  });

  it("shows error toast on failure", async () => {
    mockGetOverdueAnalysis.mockRejectedValueOnce(new Error("fail"));
    mockToast.error.mockClear();

    await renderPage();

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });
  });
});
