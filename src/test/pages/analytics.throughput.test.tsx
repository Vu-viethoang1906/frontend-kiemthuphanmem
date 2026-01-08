import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { within } from "@testing-library/dom";
import Throughput from "../../pages/Analytics/Throughput";
import { fetchMyBoards } from "../../api/boardApi";
import { getThroughputAndCFD } from "../../api/analyticsApi";
import toast from "react-hot-toast";

jest.mock("../../api/boardApi", () => ({
  fetchMyBoards: jest.fn(),
}));

jest.mock("../../api/analyticsApi", () => ({
  getThroughputAndCFD: jest.fn(),
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
  Doughnut: () => <div data-testid="doughnut-chart" />, // not used but mocked for safety
}));

const boards = [
  { _id: "b1", title: "Board One" },
  { id: "b2", name: "Board Two" },
];

const throughputPayload = {
  columnFlow: {
    Todo: { entered: 5, exited: 3 },
    Doing: { entered: 3, exited: 4 },
  },
  columnAvgTimes: {
    Todo: 10,
    Doing: 20,
  },
  cfd: [
    { date: "2024-01-01", Todo: 1, Doing: 2 },
    { date: "2024-01-02", Todo: 2, Doing: 3 },
  ],
  wipViolations: {},
};

const arrange = () => render(<Throughput />);

describe("Throughput page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (fetchMyBoards as jest.Mock).mockResolvedValue({ data: boards });
    (getThroughputAndCFD as jest.Mock).mockResolvedValue({
      success: true,
      data: throughputPayload,
    });
  });

  it("loads boards and renders throughput summary", async () => {
    arrange();

    await waitFor(() => {
      expect(getThroughputAndCFD).toHaveBeenCalledWith({
        boardId: "b1",
        startDate: expect.any(String),
        endDate: expect.any(String),
        wipLimit: 5,
      });
    });

    expect(screen.getByRole("combobox")).toHaveValue("b1");
    const enteredCards = screen.getAllByText(/Tasks Entered/i);
    const enteredCard = enteredCards[0].closest("div");
    expect(within(enteredCard as HTMLElement).getByText("8")).toBeInTheDocument();
    expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThan(0);
  });

  it("refetches when board or WIP limit changes", async () => {
    arrange();

    const boardSelect = await screen.findByRole("combobox");
    fireEvent.change(boardSelect, { target: { value: "b2" } });
    await waitFor(() => {
      expect(getThroughputAndCFD).toHaveBeenLastCalledWith({
        boardId: "b2",
        startDate: expect.any(String),
        endDate: expect.any(String),
        wipLimit: 5,
      });
    });

    const wipInput = screen.getByDisplayValue("5");
    fireEvent.change(wipInput, { target: { value: "10" } });
    await waitFor(() => {
      expect(getThroughputAndCFD).toHaveBeenLastCalledWith({
        boardId: "b2",
        startDate: expect.any(String),
        endDate: expect.any(String),
        wipLimit: 10,
      });
    });
  });

  it("shows empty state when no data returned", async () => {
    (getThroughputAndCFD as jest.Mock).mockResolvedValue({ success: true, data: null });
    arrange();

    await waitFor(() => {
      expect(screen.getByText(/No data available/i)).toBeInTheDocument();
    });
  });

  it("surfaces fetch board error", async () => {
    (fetchMyBoards as jest.Mock).mockRejectedValue(new Error("boom"));
    arrange();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load board list");
    });
    expect(screen.getByText(/No data available/i)).toBeInTheDocument();
  });

  it("surfaces throughput API error", async () => {
    (getThroughputAndCFD as jest.Mock).mockRejectedValue({
      response: { data: { message: "bad request" } },
    });

    arrange();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("bad request");
    });
  });
});