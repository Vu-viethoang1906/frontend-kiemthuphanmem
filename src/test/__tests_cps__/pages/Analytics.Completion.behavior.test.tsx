import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSetSearchParams = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: "/analytics/completion" }),
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
  }),
  { virtual: true }
);

jest.mock("react-chartjs-2", () => ({
  Line: ({ data }: any) => <div data-testid="line-chart">{JSON.stringify(data.labels)}</div>,
  Bar: ({ data }: any) => <div data-testid="bar-chart">{JSON.stringify(data.labels)}</div>,
}));

const mockFetchMyBoards = jest.fn();
jest.mock("../../../api/boardApi", () => ({
  fetchMyBoards: (...args: any[]) => mockFetchMyBoards(...args),
}));

const mockGetCompletionSpeed = jest.fn();
jest.mock("../../../api/analyticsApi", () => ({
  getCompletionSpeed: (...args: any[]) => mockGetCompletionSpeed(...args),
}));

const mockToast = { error: jest.fn(), success: jest.fn() } as any;
jest.mock("react-hot-toast", () => mockToast);

const sampleData = {
  success: true,
  data: {
    board: { id: "board-1", title: "Board One" },
    dateRange: { start: "2024-01-01", end: "2024-02-01" },
    weeklyData: [
      {
        weekNumber: 1,
        week: "W1",
        start: "2024-01-01",
        end: "2024-01-07",
        completedTasks: 5,
        priorityBreakdown: { High: 2, Medium: 2, Low: 1, None: 0 },
      },
      {
        weekNumber: 2,
        week: "W2",
        start: "2024-01-08",
        end: "2024-01-14",
        completedTasks: 7,
        priorityBreakdown: { High: 3, Medium: 2, Low: 2, None: 0 },
      },
    ],
    averageVelocity: 6,
    trend: { slope: 0.5, intercept: 0, direction: "increasing" },
    previousPeriodComparison: {
      previousPeriod: { average: 4, total: 8, weeks: 2 },
      currentPeriod: { average: 6, total: 12, weeks: 2 },
      difference: 2,
      percentageChange: 50,
      direction: "increasing",
    },
    priorityBreakdown: {
      total: { High: 5, Medium: 4, Low: 3, None: 0 },
      percentages: { High: 41, Medium: 33, Low: 26, None: 0 },
    },
    forecast: { nextWeek: 8, next2Weeks: 15, next4Weeks: 30, confidence: "medium" },
  },
};

describe("pages/Analytics/Completion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchMyBoards.mockResolvedValue({ data: [{ _id: "board-1", title: "Board One" }] });
    mockGetCompletionSpeed.mockResolvedValue(sampleData);
  });

  it("renders empty state when no boards are available", async () => {
    mockFetchMyBoards.mockResolvedValueOnce({ data: [] });

    const Comp = require("../../../pages/Analytics/Completion").default;
    render(<Comp />);

    expect(await screen.findByText(/no data available/i)).toBeInTheDocument();
    expect(mockGetCompletionSpeed).not.toHaveBeenCalled();
  });

  it("loads board data and displays metrics and charts", async () => {
    const Comp = require("../../../pages/Analytics/Completion").default;
    render(<Comp />);

    await waitFor(() => expect(mockGetCompletionSpeed).toHaveBeenCalled());
    expect(await screen.findByText(/Completion Speed Analysis/)).toBeInTheDocument();
    expect(screen.getByText("Board One")).toBeInTheDocument();
    expect(screen.getByText(/Average Velocity/i)).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("bar-chart")).toHaveLength(2);
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it("refreshes data when filters change", async () => {
    const Comp = require("../../../pages/Analytics/Completion").default;
    render(<Comp />);

    await waitFor(() => expect(mockGetCompletionSpeed).toHaveBeenCalledTimes(1));

    const today = new Date().toISOString().split("T")[0];
    const endInput = screen.getByDisplayValue(today);
    await userEvent.clear(endInput);
    await userEvent.type(endInput, "2024-02-15");

    await waitFor(() => expect(mockGetCompletionSpeed).toHaveBeenCalledTimes(2));
  });
});
