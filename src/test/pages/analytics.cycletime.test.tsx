import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CycleTime from "../../pages/Analytics/CycleTime";
import { fetchMyBoards } from "../../api/boardApi";
import { getCycleTime } from "../../api/analyticsApi";
import toast from "react-hot-toast";

jest.mock("../../api/boardApi", () => ({
  fetchMyBoards: jest.fn(),
}));

jest.mock("../../api/analyticsApi", () => ({
  getCycleTime: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
  }),
  { virtual: true }
);

jest.mock("react-chartjs-2", () => ({
  Line: (props: any) => <div data-testid="line-chart">{props?.data?.labels?.length || 0}</div>,
  Bar: (props: any) => <div data-testid="bar-chart">{props?.data?.labels?.join(",")}</div>,
  Doughnut: () => <div data-testid="doughnut-chart" />,
}));

const boards = [
  { _id: "b1", title: "Board One" },
  { id: "b2", name: "Board Two" },
];

const baseCycleData = {
  board: { id: "b1", title: "Board One" },
  summary: {
    totalTasks: 10,
    completedTasks: 8,
    averageCycleTime: 36, // 1d 12.0h
    medianCycleTime: 12,
    p90CycleTime: 48,
    averageCycleTimeDays: 1.5,
    medianCycleTimeDays: 0.5,
    p90CycleTimeDays: 2,
  },
  breakdown: {
    byPriority: {
      High: { count: 3, average: 10, median: 9, p90: 15 },
      Medium: { count: 4, average: 8, median: 7, p90: 10 },
    },
    bySwimlane: {
      Delivery: { count: 5, average: 20, median: 18, p90: 25 },
      Maintenance: { count: 2, average: 15, median: 12, p90: 18 },
    },
  },
  outliers: [
    {
      task_id: "t1",
      title: "Very long task",
      assigned_to: { id: "u1", name: "Alex" },
      cycleTimeHours: 60,
      cycleTimeDays: 2.5,
      medianCycleTime: 12,
      ratio: 5,
    },
  ],
  columnMedians: { Todo: 5 },
  tasks: [
    {
      task_id: "t1",
      title: "Very long task",
      assigned_to: { id: "u1", name: "Alex", email: "a@example.com" },
      priority: "High",
      swimlane: "Delivery",
      cycleTimeHours: 60,
      cycleTimeDays: 2.5,
      columnDurations: [{ column: "Doing", hours: 50 }],
      isOutlier: true,
    },
    {
      task_id: "t2",
      title: "Quick task",
      assigned_to: null,
      priority: "Low",
      swimlane: "Maintenance",
      cycleTimeHours: 6,
      cycleTimeDays: 0.25,
      columnDurations: [{ column: "Todo", hours: 2 }],
      isOutlier: false,
    },
  ],
};

const arrange = () => render(<CycleTime />);

describe("CycleTime page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (fetchMyBoards as jest.Mock).mockResolvedValue({ data: boards });
    (getCycleTime as jest.Mock).mockResolvedValue({
      success: true,
      data: baseCycleData,
    });
  });

  it("renders cycle time summary and charts", async () => {
    arrange();

    await waitFor(() => {
      expect(getCycleTime).toHaveBeenCalledWith({ idBoard: "b1" });
    });

    expect(screen.getByRole("combobox")).toHaveValue("b1");
    expect(screen.getAllByText(/Average Cycle Time/i)[0]).toBeInTheDocument();
    expect(screen.getByText("1d 12.0h")).toBeInTheDocument();
    expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThan(0);
    expect(screen.getByText(/Outlier Tasks/i)).toBeInTheDocument();
    expect(screen.getAllByText("Very long task")[0]).toBeInTheDocument();
  });

  it("refetches when board changes", async () => {
    arrange();

    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "b2" } });

    await waitFor(() => {
      expect(getCycleTime).toHaveBeenLastCalledWith({ idBoard: "b2" });
    });
  });

  it("shows empty state when API returns no data", async () => {
    (getCycleTime as jest.Mock).mockResolvedValueOnce({ success: true, data: null });
    arrange();

    await waitFor(() => {
      expect(screen.getByText(/No data available/i)).toBeInTheDocument();
    });
  });

  it("surfaces board fetch error", async () => {
    (fetchMyBoards as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    arrange();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load board list");
    });
  });

  it("surfaces cycle time API error", async () => {
    (getCycleTime as jest.Mock).mockRejectedValueOnce({ response: { data: { message: "bad" } } });
    arrange();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("bad");
    });
  });
});