import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockFetchCommentsByTask = jest.fn();
const mockCreateComment = jest.fn();
const mockUpdateComment = jest.fn();
const mockDeleteComment = jest.fn();
const mockSummarizeComments = jest.fn();
const mockConfirm = jest.fn();

jest.mock("../../../api/commentApi", () => ({
  fetchCommentsByTask: (...args: any[]) => mockFetchCommentsByTask(...args),
  createComment: (...args: any[]) => mockCreateComment(...args),
  updateComment: (...args: any[]) => mockUpdateComment(...args),
  deleteComment: (...args: any[]) => mockDeleteComment(...args),
}));

jest.mock("../../../api/fileApi", () => ({
  uploadFileToComment: jest.fn(),
  downloadFile: jest.fn(),
  deleteFileFromComment: jest.fn(),
}));

jest.mock("../../../api/nlpApi", () => ({
  summarizeComments: (...args: any[]) => mockSummarizeComments(...args),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../../socket", () => ({
  socket: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));

jest.mock("../../../components/ModalProvider", () => ({
  useModal: () => ({ confirm: mockConfirm }),
}));

import CommentSection, { TaskComment } from "../../../components/CommentSection";

describe("CommentSection", () => {
  const baseComments: TaskComment[] = [
    {
      _id: "c1",
      task_id: "task-1",
      user_id: "u1",
      content: "Parent comment",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      _id: "c2",
      task_id: "task-1",
      user_id: "u2",
      content: "Reply content",
      created_at: "2024-01-01T01:00:00Z",
      updated_at: "2024-01-01T01:00:00Z",
      Collaboration: "c1",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem("userId", "u1");
    mockFetchCommentsByTask.mockResolvedValue({ data: baseComments });
    mockCreateComment.mockResolvedValue({});
    mockDeleteComment.mockResolvedValue({});
    mockUpdateComment.mockResolvedValue({});
    mockSummarizeComments.mockResolvedValue({
      status: "success",
      data: {
        success: true,
        summary: "Summary text",
        keyPoints: ["Point A"],
        decisions: ["Decision D"],
        actionItems: ["Action X"],
        unresolvedIssues: ["Issue U"],
        participants: ["Alice"],
        totalComments: baseComments.length,
      },
    });
    mockConfirm.mockResolvedValue(true);
  });

  const renderComponent = () => render(<CommentSection taskId="task-1" />);

  it("loads comments and groups replies under their parents", async () => {
    renderComponent();

    await screen.findByText("Parent comment");
    await waitFor(() =>
      expect(screen.getByText(/Comments/)).toHaveTextContent("Comments (2)")
    );
    expect(screen.getByText("Reply content")).toBeInTheDocument();
  });

  it("adds a new comment and refreshes the list", async () => {
    mockFetchCommentsByTask.mockResolvedValueOnce({ data: [] });
    mockFetchCommentsByTask.mockResolvedValueOnce({
      data: [
        {
          _id: "new",
          task_id: "task-1",
          user_id: "u1",
          content: "Hello world",
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
      ],
    });

    renderComponent();

    fireEvent.change(screen.getByPlaceholderText(/add a comment/i), {
      target: { value: "Hello world" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(mockCreateComment).toHaveBeenCalled());
    expect(mockCreateComment).toHaveBeenCalledWith({
      task_id: "task-1",
      content: "Hello world",
      user_id: "u1",
    });
    await waitFor(() => expect(mockFetchCommentsByTask).toHaveBeenCalledTimes(2));
  });

  it("adds a reply using the collaborations field", async () => {
    renderComponent();

    await screen.findByText("Parent comment");
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));

    fireEvent.change(screen.getByPlaceholderText(/viết trả lời/i), {
      target: { value: "Child reply" },
    });
    const sendButtons = screen.getAllByRole("button", { name: "Send" });
    fireEvent.click(sendButtons[sendButtons.length - 1]);

    await waitFor(() =>
      expect(mockCreateComment).toHaveBeenCalledWith({
        task_id: "task-1",
        content: "Child reply",
        user_id: "u1",
        collaborations: "c1",
      })
    );
  });

  it("shows AI summary when summarize succeeds", async () => {
    renderComponent();

    await screen.findByRole("button", { name: /AI Tóm tắt/i });
    fireEvent.click(screen.getByRole("button", { name: /AI Tóm tắt/i }));

    await waitFor(() => expect(mockSummarizeComments).toHaveBeenCalled());
    expect(await screen.findByText("Summary text")).toBeInTheDocument();
    expect(screen.getByText(/Point A/)).toBeInTheDocument();
    expect(screen.getByText(/Decision D/)).toBeInTheDocument();
  });

  it("deletes a comment when confirmed", async () => {
    renderComponent();

    await screen.findByText("Parent comment");
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockDeleteComment).toHaveBeenCalledWith("c1");
  });
});
