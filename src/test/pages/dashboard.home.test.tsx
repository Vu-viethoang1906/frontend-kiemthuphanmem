import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import DashboardHome from "../../pages/DashBoard/DashboardHome";
import { fetchMyBoards } from "../../api/boardApi";
import { fetchTasksByBoard } from "../../api/taskApi";
import axiosInstance from "../../api/axiosInstance";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  __esModule: true,
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
  useNavigate: () => mockNavigate,
}), { virtual: true });

jest.mock("../../api/boardApi", () => ({
  __esModule: true,
  fetchMyBoards: jest.fn(),
}));

jest.mock("../../api/taskApi", () => ({
  __esModule: true,
  fetchTasksByBoard: jest.fn(),
}));

jest.mock("../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../socket", () => ({
  socket: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));

const mockedFetchMyBoards = fetchMyBoards as jest.Mock;
const mockedFetchTasksByBoard = fetchTasksByBoard as jest.Mock;
const mockedAxios = axiosInstance as unknown as {
  get: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
};

const now = new Date();
const recentIso = now.toISOString();
const pastIso = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();

const boards = [
  { _id: "b1", title: "Alpha Project" },
  { _id: "b2", title: "Beta Project" },
];

const tasksByBoard: Record<string, any[]> = {
  b1: [
    {
      _id: "t1",
      status: "Completed",
      priority: "high",
      column: { name: "Done", isDone: true },
      created_at: recentIso,
      updated_at: recentIso,
      due_date: recentIso,
      created_by: { _id: "u1" },
      assigned_to: { _id: "u2" },
    },
    {
      _id: "t2",
      status: "In Progress",
      priority: "medium",
      column: { name: "In Progress" },
      created_at: recentIso,
      updated_at: recentIso,
      due_date: pastIso,
      created_by: { _id: "u1" },
      assigned_to: { _id: "u3" },
    },
  ],
  b2: [
    {
      _id: "t3",
      status: "To Do",
      priority: "low",
      column: { name: "To Do" },
      created_at: recentIso,
      updated_at: recentIso,
      created_by: { _id: "u2" },
      assigned_to: [{ _id: "u4" }],
    },
    {
      _id: "t4",
      status: "Review",
      priority: undefined,
      column: { name: "Review" },
      created_at: recentIso,
      updated_at: recentIso,
      created_by: { _id: "u2" },
    },
    {
      _id: "t5",
      status: "Open",
      priority: "high",
      column: { name: "Backlog" },
      created_at: recentIso,
      updated_at: recentIso,
      created_by: { _id: "u3" },
    },
  ],
};

const notifications = [
  {
    _id: "n1",
    body: "New task assigned",
    created_at: recentIso,
    board_id: "b1",
    task_id: "t2",
  },
  {
    _id: "n2",
    body: "Old note",
    created_at: recentIso,
    read_at: recentIso,
  },
];

const setupMocks = () => {
  mockedFetchMyBoards.mockResolvedValue({ data: boards });
  mockedFetchTasksByBoard.mockImplementation((boardId: string) =>
    Promise.resolve({ data: tasksByBoard[boardId] || [] })
  );
  mockedAxios.get.mockResolvedValue({ data: { data: notifications } });
  mockedAxios.put.mockResolvedValue({});
  mockedAxios.delete.mockResolvedValue({});
};

describe("DashboardHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("userId", "user-123");
    setupMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders stats and project data after loading", async () => {
    render(<DashboardHome />);

    expect(screen.getByText(/Loading Overview/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/Total Projects/i)).toBeInTheDocument()
    );

    expect(screen.getByText("Alpha Project")).toBeInTheDocument();
    expect(screen.getByText("Beta Project")).toBeInTheDocument();
    expect(screen.getAllByText(/20\.0%/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Needs attention!/i)).toBeInTheDocument();
    expect(screen.getByText(/Tasks by Priority/i)).toBeInTheDocument();
    expect(screen.getByText(/Tasks by Status/i)).toBeInTheDocument();
  });

  it("navigates when clicking dashboard cards and projects", async () => {
    render(<DashboardHome />);

    const totalProjectsCard = await screen.findByRole("button", {
      name: /Total Projects/i,
    });
    fireEvent.click(totalProjectsCard);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/projects");

    fireEvent.click(screen.getByRole("button", { name: /View All/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/projects");

    const projectRow = await screen.findByRole("button", {
      name: /Alpha Project/i,
    });
    fireEvent.click(projectRow);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/boards/b1");
  });

  it("handles notification actions and navigation", async () => {
    jest.useFakeTimers();
    render(<DashboardHome />);

    const unreadItem = await screen.findByText(/New task assigned/i);

    fireEvent.click(unreadItem);
    act(() => {
      jest.advanceTimersByTime(260);
    });

    await waitFor(() =>
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/notification/read/n1"
      )
    );

    fireEvent.click(screen.getByRole("button", { name: /Mark all read/i }));
    await waitFor(() =>
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/notification/read/n1"
      )
    );

    fireEvent.click(screen.getByRole("button", { name: /^Read/ }));
    const readItem = await screen.findByText(/Old note/i);
    expect(readItem).toBeInTheDocument();

    const newlyReadItem = await screen.findByText(/New task assigned/i);
    fireEvent.click(newlyReadItem);
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/project/b1/t2")
    );

    fireEvent.click(screen.getByRole("button", { name: /Clear read/i }));
    await waitFor(() =>
      expect(mockedAxios.delete).toHaveBeenCalledWith("/notification/n1")
    );
    await waitFor(() =>
      expect(mockedAxios.delete).toHaveBeenCalledWith("/notification/n2")
    );
  });
});
