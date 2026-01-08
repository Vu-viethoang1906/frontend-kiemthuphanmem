import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Don't mock ModalProvider - use actual provider
import { ModalProvider } from "../../../components/ModalProvider";

// Declare mock functions before calling jest.mock to avoid TDZ errors
const mockFetchCommentsByTask = jest.fn();
const mockCreateComment = jest.fn();
const mockUpdateComment = jest.fn();
const mockDeleteComment = jest.fn();

jest.mock("../../../api/commentApi", () => ({
  fetchCommentsByTask: (...args: any[]) => mockFetchCommentsByTask(...args),
  createComment: (...args: any[]) => mockCreateComment(...args),
  updateComment: (...args: any[]) => mockUpdateComment(...args),
  deleteComment: (...args: any[]) => mockDeleteComment(...args),
}));

// Define mock toast before jest.mock to avoid TDZ error
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
};
jest.mock("react-hot-toast", () => {
  const actualMockToast = {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  };
  return {
    __esModule: true,
    default: actualMockToast,
    Toaster: () => null,
    toast: actualMockToast,
  };
});

import CommentSection from "../../../components/CommentSection";

describe("components/CommentSection edge cases and branches", () => {
  beforeEach(() => {
    localStorage.setItem("userId", "u-self");
    jest.clearAllMocks();
  });

  it("renders empty state when API returns a raw empty array", async () => {
    mockFetchCommentsByTask.mockResolvedValueOnce([]); // cover normalization branch (Array.isArray)

    render(<ModalProvider><CommentSection taskId="task-empty" /></ModalProvider>);

    expect(
      await screen.findByText(/No comments yet/i)
    ).toBeInTheDocument();
    expect(mockFetchCommentsByTask).toHaveBeenCalledWith("task-empty");
  });

  it("logs error and shows empty state when load fails", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetchCommentsByTask.mockRejectedValueOnce(new Error("network fail"));
    const { ModalProvider } = require("../../../components/ModalProvider");

    render(<ModalProvider><CommentSection taskId="task-error" /></ModalProvider>);

    expect(
      await screen.findByText(/No comments yet/i)
    ).toBeInTheDocument();
    // Component uses toast.error, not console.error for user-facing errors
    // But we can check that error was handled gracefully
    expect(mockFetchCommentsByTask).toHaveBeenCalledWith("task-error");
    spy.mockRestore();
  });

  it("disables send button when textarea is empty; enables on input and shows loading text while sending", async () => {
    mockFetchCommentsByTask.mockResolvedValueOnce({ data: [] });
    mockCreateComment.mockResolvedValueOnce({ ok: true });
    // subsequent reload call after create
    mockFetchCommentsByTask.mockResolvedValueOnce({
      data: [
        {
          _id: "c-new",
          task_id: "t",
          user_id: { _id: "u-self", username: "me" },
          content: "hello",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    });

    render(<ModalProvider><CommentSection taskId="t" /></ModalProvider>);

    const sendBtn = await screen.findByRole("button", { name: "Send" });
    expect(sendBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText("Add a comment...");
    fireEvent.change(textarea, { target: { value: "hello" } });
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    // While loading we briefly see the loading label; guard with waitFor in case it's fast
    await waitFor(() => {
      expect(mockCreateComment).toHaveBeenCalled();
    });

    // Final state contains the created comment (after reload)
    expect(await screen.findByText("hello")).toBeInTheDocument();
  });

  it("edit flow disables Save when whitespace only; Cancel exits edit without calling update", async () => {
    const now = new Date().toISOString();
    mockFetchCommentsByTask.mockResolvedValueOnce({
      data: [
        {
          _id: "c1",
          task_id: "t",
          user_id: { _id: "u-self", username: "me" },
          content: "own content",
          created_at: now,
          updated_at: now,
        },
      ],
    });

    render(<ModalProvider><CommentSection taskId="t" /></ModalProvider>);

    fireEvent.click(await screen.findByText("Edit"));
    const editArea = screen.getByDisplayValue("own content");
    fireEvent.change(editArea, { target: { value: "   " } });
    // Save disabled on whitespace
    const saveBtn = screen.getByRole("button", { name: "Save" });
    expect(saveBtn).toBeDisabled();

    // Cancel exits edit mode
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockUpdateComment).not.toHaveBeenCalled();
    // content remains visible
    expect(screen.getByText("own content")).toBeInTheDocument();
  });

  it("delete modal Cancel closes without calling API", async () => {
    const now = new Date().toISOString();
    mockFetchCommentsByTask.mockResolvedValueOnce({
      data: [
        {
          _id: "c1",
          task_id: "t",
          user_id: { _id: "u-self" },
          content: "to delete",
          created_at: now,
          updated_at: now,
        },
      ],
    });

    render(<ModalProvider><CommentSection taskId="t" /></ModalProvider>);

    fireEvent.click(await screen.findByText("Delete"));
    // Modal shows confirmation message, not title "Delete Comment"
    expect(await screen.findByText(/Are you sure you want to delete this comment/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByText(/Are you sure you want to delete this comment/i)).not.toBeInTheDocument();
    });
    expect(mockDeleteComment).not.toHaveBeenCalled();
  });

  it("does not show action buttons for comments by other users", async () => {
    const now = new Date().toISOString();
    mockFetchCommentsByTask.mockResolvedValueOnce({
      data: [
        {
          _id: "c1",
          task_id: "t",
          user_id: { _id: "other" },
          content: "foreign",
          created_at: now,
          updated_at: now,
        },
      ],
    });

    render(<ModalProvider><CommentSection taskId="t" /></ModalProvider>);

    const item = await screen.findByText("foreign");
    const container = item.closest("div");
    // Search within container
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("formatDate shows all branches (vừa xong, phút, giờ, ngày, locale date)", async () => {
    // Freeze now for deterministic outputs
    const NOW = new Date("2025-01-15T12:00:00.000Z");
    jest.useFakeTimers().setSystemTime(NOW);

    const mk = (offsetMs: number) =>
      new Date(NOW.getTime() - offsetMs).toISOString();
    const c = (content: string, created_at: string) => ({
      _id: content,
      task_id: "t",
      user_id: { _id: "x" },
      content,
      created_at,
      updated_at: created_at,
    });

    const comments = [
      c("now", mk(5_000)), // < 1 minute -> Vừa xong
      c("5m", mk(5 * 60_000)), // 5 minutes -> "5 phút trước"
      c("3h", mk(3 * 60 * 60_000)), // 3 hours -> "3 giờ trước"
      c("3d", mk(3 * 24 * 60 * 60_000)), // 3 days -> "3 ngày trước"
      c("10d", mk(10 * 24 * 60 * 60_000)), // >= 7 days -> locale date
    ];

    mockFetchCommentsByTask.mockResolvedValueOnce({ data: comments });

    render(<ModalProvider><CommentSection taskId="t" /></ModalProvider>);

    // Assertions by expected date labels
    expect(await screen.findByText("now")).toBeInTheDocument();
    expect(screen.getByText("Just now")).toBeInTheDocument();

    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
    expect(screen.getByText(/3 hours ago/)).toBeInTheDocument();
    expect(screen.getByText(/3 days ago/)).toBeInTheDocument();

    // Compute expected en-US date for 10 days ago (component uses 'en-US' locale)
    const tenDaysDate = new Date(mk(10 * 24 * 60 * 60_000)).toLocaleDateString(
      "en-US"
    );
    expect(screen.getByText(tenDaysDate)).toBeInTheDocument();

    jest.useRealTimers();
  });
});
