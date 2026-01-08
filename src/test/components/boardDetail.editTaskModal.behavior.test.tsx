import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditTaskModal from "../../components/BoardDetail/EditTaskModal";
import { ModalProvider } from "../../components/ModalProvider";

// Minimal props for EditTaskModal per its interface
const editingTask = {
  id: "t-101",
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
const columns = [{ id: "col-1", name: "Todo" }];
const swimlanes: any[] = [];
const board = { title: "Board A" };
const allTags: any[] = [];
const taskTags: any[] = [];
const boardMembers: any[] = [];

describe("EditTaskModal behavior", () => {
  it("renders attached file name and download action", async () => {
    render(
      <ModalProvider>
        <EditTaskModal
          show={true}
          editingTask={editingTask as any}
          board={board}
          columns={columns as any}
          swimlanes={swimlanes}
          allTags={allTags}
          taskTags={taskTags}
          tagSearchInput=""
          selectedTagId=""
          boardMembers={boardMembers}
          onClose={() => {}}
          onTaskChange={() => {}}
          onTagSearchChange={() => {}}
          onTagSelect={() => {}}
          onRemoveTag={() => {}}
          onUpdate={() => {}}
          onDelete={() => {}}
        />
      </ModalProvider>
    );

    // File name should be visible
    expect(await screen.findByText(/a\.txt/i)).toBeInTheDocument();
    // Download button exists with title
    const downloadButtons = await screen.findAllByTitle(/Download file/i);
    expect(downloadButtons.length).toBeGreaterThan(0);
  });
});
