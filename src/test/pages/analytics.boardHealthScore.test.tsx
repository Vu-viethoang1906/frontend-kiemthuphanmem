import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

import BoardHealthScore from "../../pages/Analytics/BoardHealthScore";
import { fetchMyBoards } from "../../api/boardApi";
import { getBoardHealthScore } from "../../api/analyticsApi";
import toast from "react-hot-toast";

jest.mock("../../api/boardApi", () => ({
  fetchMyBoards: jest.fn(),
}));

jest.mock("../../api/analyticsApi", () => ({
  getBoardHealthScore: jest.fn(),
}));

const mockBoards = [
  { _id: "b1", title: "Board 1" },
  { id: "b2", name: "Board 2" },
];

const mockHealthData = {
  success: true,
  data: {
    success: true,
    healthScore: 82,
    status: "Green" as const,
    recommendations: ["Ship more small tasks"],
    metrics: {
      completionRate: 90,
      onTimeRate: 80,
      avgCycleTime: 5,
      dueDateCoverage: 70,
      assignmentCoverage: 60,
    },
  },
};

const setupRender = () => render(<BoardHealthScore />);

describe("BoardHealthScore page", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (fetchMyBoards as jest.Mock).mockResolvedValue({ data: mockBoards });
    (getBoardHealthScore as jest.Mock).mockResolvedValue(mockHealthData);
  });

  it("loads boards and renders health metrics", async () => {
    setupRender();

    await waitFor(() => {
      expect(getBoardHealthScore).toHaveBeenCalledWith("b1");
    });

    expect(screen.getByRole("combobox")).toHaveValue("b1");
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText(/Completion Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Ship more small tasks/i)).toBeInTheDocument();
  });

  it("disables reload when nothing is selected", async () => {
    (fetchMyBoards as jest.Mock).mockResolvedValue({ data: [] });
    setupRender();

    // Wait for component to finish loading boards
    await waitFor(() => {
      const reloadBtn = screen.getByRole("button", { name: /Refresh/i });
      expect(reloadBtn).toBeDisabled();
    });
    expect(getBoardHealthScore).not.toHaveBeenCalled();
  });

  it("shows empty state when boards fail to load", async () => {
    (fetchMyBoards as jest.Mock).mockRejectedValue(new Error("boom"));
    setupRender();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load board list");
    });

    expect(
      screen.getByText(/Select a board to view the health score/i)
    ).toBeInTheDocument();
  });

  it("surfaces API error when health score request fails", async () => {
    (getBoardHealthScore as jest.Mock).mockRejectedValue({
      response: { data: { message: "bad request" } },
    });

    setupRender();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("bad request");
    });
  });

  it("uses fallback data when success flag is false", async () => {
    (getBoardHealthScore as jest.Mock).mockResolvedValue({
      success: false,
      data: {
        success: false,
        healthScore: 55,
        status: "Yellow" as const,
        recommendations: ["Add due dates"],
        metrics: {
          completionRate: 50,
          onTimeRate: 45,
          avgCycleTime: 10,
          dueDateCoverage: 40,
          assignmentCoverage: 35,
        },
      },
    });

    setupRender();

    await waitFor(() => {
      expect(screen.getByText(/Yellow/)).toBeInTheDocument();
    });
    expect(screen.getByText("55")).toBeInTheDocument();
  });
});
