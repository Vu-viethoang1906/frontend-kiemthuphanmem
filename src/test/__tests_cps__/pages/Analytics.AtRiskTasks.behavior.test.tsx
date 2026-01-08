import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockNavigate = jest.fn();
const mockSetSearchParams = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
  }),
  { virtual: true }
);

const mockFetchMyBoards = jest.fn();
const mockGetAtRiskTasksByBoard = jest.fn();
const mockGetAtRiskTasksByUser = jest.fn();
const mockDetectAtRiskTasks = jest.fn();

jest.mock("../../../api/boardApi", () => ({
  fetchMyBoards: (...args: any[]) => mockFetchMyBoards(...args),
}));

jest.mock("../../../api/atRiskApi", () => ({
  getAtRiskTasksByBoard: (...args: any[]) => mockGetAtRiskTasksByBoard(...args),
  getAtRiskTasksByUser: (...args: any[]) => mockGetAtRiskTasksByUser(...args),
  detectAtRiskTasks: (...args: any[]) => mockDetectAtRiskTasks(...args),
}));

const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock("react-hot-toast", () => mockToast);

const socketHandlers: Record<string, (...args: any[]) => void> = {};
const mockSocket = {
  on: jest.fn((event: string, handler: (...args: any[]) => void) => {
    socketHandlers[event] = handler;
  }),
  off: jest.fn((event: string) => {
    delete socketHandlers[event];
  }),
};

jest.mock("../../../socket", () => ({ socket: mockSocket }));

describe("pages/Analytics/AtRiskTasks", () => {
  const baseTask = {
    _id: "risk-1",
    risk_score: 1.6,
    risk_reasons: [
      { rule_name: "unassigned_near_deadline", score: 1, details: { days_until_due: 2 } },
    ],
    task_id: {
      _id: "task-1",
      title: "Critical Task",
      due_date: new Date().toISOString(),
      assigned_to: { full_name: "Alice" },
      column_id: { name: "Doing" },
    },
    board_id: { _id: "board-1", title: "Board One" },
    detected_at: "2024-01-01T00:00:00Z",
    recommendations: ["task chua bat dau"],
  } as any;

  const lowRiskTask = {
    ...baseTask,
    _id: "risk-2",
    task_id: { ...baseTask.task_id, _id: "task-2", title: "Routine Task" },
    board_id: { _id: "board-2", title: "Board Two" },
    risk_score: 0.4,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem("userId", "user-123");

    mockFetchMyBoards.mockResolvedValue({
      data: [
        { _id: "board-1", title: "Board One" },
        { _id: "board-2", title: "Board Two" },
      ],
    });

    mockGetAtRiskTasksByBoard.mockImplementation(async (boardId: string) => {
      if (boardId === "board-2") {
        return { success: true, data: [lowRiskTask] };
      }
      return { success: true, data: [baseTask] };
    });

    mockGetAtRiskTasksByUser.mockResolvedValue({ success: true, data: [lowRiskTask] });
    mockDetectAtRiskTasks.mockResolvedValue({ success: true, message: "OK" });
  });

  const renderPage = () => {
    const Comp = require("../../../pages/Analytics/AtRiskTasks").default;
    return render(<Comp />);
  };

  it("loads boards, fetches tasks, and switches boards", async () => {
    renderPage();

    await waitFor(() => expect(mockGetAtRiskTasksByBoard).toHaveBeenCalledWith("board-1"));
    expect(await screen.findByText("Critical Task")).toBeInTheDocument();

    const boardInput = screen.getByPlaceholderText(/select board/i);
    await userEvent.click(boardInput);
    await userEvent.clear(boardInput);
    await userEvent.click(boardInput);
    await userEvent.click(await screen.findByText("Board Two"));

    await waitFor(() => expect(mockGetAtRiskTasksByBoard).toHaveBeenCalledWith("board-2"));
    expect(await screen.findByText("Routine Task")).toBeInTheDocument();
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it("runs detection in user mode and reloads from user endpoint", async () => {
    renderPage();

    await screen.findByRole("button", { name: /run detection/i });
    const [viewModeSelect] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(viewModeSelect, "user");

    await waitFor(() => expect(mockGetAtRiskTasksByUser).toHaveBeenCalledTimes(1));

    const detectButton = screen.getByRole("button", { name: /run detection/i });
    await userEvent.click(detectButton);

    await waitFor(() => expect(mockDetectAtRiskTasks).toHaveBeenCalledWith(undefined));
    await waitFor(() => expect(mockGetAtRiskTasksByUser).toHaveBeenCalledTimes(2));
  });

  it("responds to socket updates and shows translated recommendations", async () => {
    renderPage();

    await waitFor(() => expect(mockGetAtRiskTasksByBoard).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Task not started yet/)).toBeInTheDocument();

    const handler =
      socketHandlers["at_risk_task_detected"] ||
      [...mockSocket.on.mock.calls].reverse().find(([event]) => event === "at_risk_task_detected")?.[1];
    expect(handler).toBeDefined();

    await act(async () => {
      handler?.({ task_title: "Incoming" });
      await Promise.resolve();
    });

    await waitFor(() => expect(mockGetAtRiskTasksByBoard).toHaveBeenCalledTimes(2));
    expect(mockSocket.off).toHaveBeenCalledWith("at_risk_task_detected", expect.any(Function));
  });
});
