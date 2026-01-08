import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditTaskModal from "../../components/BoardDetail/EditTaskModal";
import { useModal } from "../../components/ModalProvider";
import { downloadFile, deleteFileFromTask } from "../../api/fileApi";
import toast from "react-hot-toast";

jest.mock("../../components/ModalProvider", () => ({
  __esModule: true,
  useModal: jest.fn(),
}));

jest.mock("../../components/CommentSection", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ onCommentsUpdated }: any) => {
      React.useEffect(() => {
        const timer = setTimeout(() => {
          onCommentsUpdated([
            {
              _id: "c-1",
              user_id: { username: "commenter" },
              created_at: "2023-01-01T00:00:00Z",
              attachments: [
                { original_name: "comment.txt", url: "/comment.txt" },
              ],
            },
          ]);
        }, 0);
        return () => clearTimeout(timer);
      }, [onCommentsUpdated]);
      return <div data-testid="comment-section-mock" />;
    },
  };
});

jest.mock("../../api/fileApi", () => ({
  downloadFile: jest.fn().mockResolvedValue(undefined),
  deleteFileFromTask: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const confirmMock = jest.fn();
const mockedUseModal = useModal as jest.MockedFunction<typeof useModal>;
const downloadFileMock = downloadFile as jest.MockedFunction<typeof downloadFile>;
const deleteFileMock = deleteFileFromTask as jest.MockedFunction<typeof deleteFileFromTask>;
const baseTask = {
  _id: "task-1",
  title: "Sample Task",
  description: "Desc",
  column_id: "col-1",
  attachments: [
    {
      original_name: "a.txt",
      url: "/download/a.txt",
      uploaded_by: { username: "tester" },
    },
  ],
};

const baseProps = {
  show: true,
  editingTask: baseTask as any,
  board: { title: "Board A" },
  columns: [{ id: "col-1", name: "Todo" }] as any[],
  swimlanes: [] as any[],
  allTags: [] as any[],
  taskTags: [] as any[],
  tagSearchInput: "",
  selectedTagId: "",
  boardMembers: [
    {
      user_id: { _id: "u1", id: "u1", username: "Bob", full_name: "Bob" },
    },
  ],
  onClose: jest.fn(),
  onTaskChange: jest.fn(),
  onTagSearchChange: jest.fn(),
  onTagSelect: jest.fn(),
  onRemoveTag: jest.fn(),
  onUpdate: jest.fn(),
  onDelete: jest.fn(),
};

const renderModal = (overrideProps: Partial<typeof baseProps> = {}) => {
  return render(<EditTaskModal {...baseProps} {...overrideProps} />);
};

beforeEach(() => {
  jest.clearAllMocks();
  confirmMock.mockReset();
  confirmMock.mockResolvedValue(true);
  mockedUseModal.mockReturnValue({ confirm: confirmMock, show: jest.fn() } as any);
  downloadFileMock.mockResolvedValue(undefined);
  deleteFileMock.mockResolvedValue(undefined);
});

describe("EditTaskModal advanced behaviors", () => {
  it("returns null when hidden or missing task", () => {
    const { rerender } = render(
      <EditTaskModal {...baseProps} show={false} />
    );
    expect(screen.queryByRole("button", { name: /save changes/i })).toBeNull();

    rerender(<EditTaskModal {...baseProps} show editingTask={null as any} />);
    expect(screen.queryByRole("button", { name: /save changes/i })).toBeNull();
  });

  it("confirms and deletes an attachment", async () => {
    const onTaskChange = jest.fn();
    renderModal({ onTaskChange });
    const deleteButton = await screen.findByTitle(/delete file/i);

    await userEvent.click(deleteButton);

    await waitFor(() =>
      expect(deleteFileMock).toHaveBeenCalledWith("task-1", 0)
    );
    expect(onTaskChange).toHaveBeenCalledWith(
      expect.objectContaining({ attachments: [] })
    );
    expect((toast as any).success).toHaveBeenCalled();
  });

  it("does not delete when confirmation is rejected", async () => {
    confirmMock.mockResolvedValue(false);
    renderModal();

    const deleteButton = await screen.findByTitle(/delete file/i);
    await userEvent.click(deleteButton);

    expect(deleteFileMock).not.toHaveBeenCalled();
  });

  it("shows error toast when delete fails", async () => {
    deleteFileMock.mockRejectedValueOnce(new Error("fail"));
    const onTaskChange = jest.fn();
    renderModal({ onTaskChange });

    const deleteButton = await screen.findByTitle(/delete file/i);
    await userEvent.click(deleteButton);

    await waitFor(() => expect((toast as any).error).toHaveBeenCalled());
    expect(onTaskChange).not.toHaveBeenCalled();
  });

  it("renders commented files and downloads them", async () => {
    renderModal({ editingTask: { ...baseTask, attachments: [] } });

    expect(await screen.findByText(/comment\.txt/i)).toBeInTheDocument();
    const downloadButton = await screen.findByTitle(/download file/i);
    await userEvent.click(downloadButton);

    expect(downloadFileMock).toHaveBeenCalledWith("/comment.txt", "comment.txt");
  });

  it("shows filtered tags and selects one", async () => {
    const onTagSelect = jest.fn();
    renderModal({
      allTags: [{ _id: "tg-1", name: "Urgent", color: "#f00" }],
      tagSearchInput: "ur",
      onTagSelect,
    });

    const searchInput = screen.getByPlaceholderText(/search tags/i);
    await userEvent.click(searchInput);

    const tagOption = await screen.findByRole("button", { name: /Urgent/i });
    await userEvent.click(tagOption);

    expect(onTagSelect).toHaveBeenCalledWith("tg-1", "Urgent");
  });

  it("disables save when title is empty and triggers delete with id/title", async () => {
    const onDelete = jest.fn();
    renderModal({
      editingTask: { ...baseTask, title: "" },
      onDelete,
    });

    const saveButton = screen.getByRole("button", { name: /save changes/i });
    expect(saveButton).toBeDisabled();

    const deleteButton = screen.getByRole("button", { name: /^delete$/i });
    await userEvent.click(deleteButton);
    expect(onDelete).toHaveBeenCalledWith("task-1", "");
  });

  it("updates assigned user via select", async () => {
    const onTaskChange = jest.fn();
    renderModal({ onTaskChange });

    const select = screen.getAllByRole("combobox")[0];
    await userEvent.selectOptions(select, "u1");

    expect(onTaskChange).toHaveBeenCalledWith(
      expect.objectContaining({
        assigned_to: {
          _id: "u1",
          username: "Bob",
          full_name: "Bob",
        },
      })
    );
  });
});
