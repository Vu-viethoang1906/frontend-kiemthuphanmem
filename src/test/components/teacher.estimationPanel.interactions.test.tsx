import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// Integration-style: rely on default handlers; avoid brittle MSW overrides
import EstimationPanel from "../../components/Teacher/EstimationPanel";

describe("Teacher EstimationPanel interactions", () => {
  it("loads data after selecting a board and clicking reload", async () => {
    render(<EstimationPanel />);

    const boardSelect = await screen.findByRole("combobox");
    const options = await screen.findAllByRole("option");
    if (options.length > 1) {
      const value = (options[1] as HTMLOptionElement).value;
      await userEvent.selectOptions(boardSelect, value);
    }

    const reload = await screen.findByRole("button", { name: /load data/i });
    await userEvent.click(reload);
    expect(screen.getAllByText(/Average deviation|Chênh lệch trung bình/i).length).toBeGreaterThan(0);
  });

  it("shows validation error when no board selected", async () => {
    render(<EstimationPanel />);

    const boardSelect = await screen.findByRole("combobox");
    const options = await screen.findAllByRole("option");
    // Intentionally do not select a board when only placeholder option exists

    const reload = await screen.findByRole("button", { name: /load data/i });
    await userEvent.click(reload);
    // Expect validation message due to empty board selection
    expect(screen.queryByText(/Please select a board/i)).toBeInTheDocument();
  });
});
