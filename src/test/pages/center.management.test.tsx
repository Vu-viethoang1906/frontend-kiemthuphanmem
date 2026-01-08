import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import CenterManagement from "../../pages/Center/CenterManagement";
import {
  getAllCenters,
  createCenter,
  updateCenter,
  deleteCenter,
} from "../../api/centerApi";
import { getCenterMembers } from "../../api/centerMemberApi";
import { useModal } from "../../components/ModalProvider";

jest.mock("../../api/centerApi", () => ({
  getAllCenters: jest.fn(),
  createCenter: jest.fn(),
  updateCenter: jest.fn(),
  deleteCenter: jest.fn(),
}));

jest.mock("../../api/centerMemberApi", () => ({
  getCenterMembers: jest.fn(),
}));

jest.mock("../../components/ModalProvider", () => ({
  useModal: jest.fn(),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: "/dashboard/centers" }),
    MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }),
  { virtual: true }
);

jest.mock("../../components/ToastNotification", () => (
  ({ message, description, onClose }: { message: string; description?: string; onClose: () => void }) => (
    <div data-testid="toast" onClick={onClose}>
      {message} {description}
    </div>
  )
));

const renderComponent = () => render(<CenterManagement />);

const mockCenters = [
  {
    _id: "c1",
    name: "Center A",
    status: "active",
    address: "123 Street",
    email: "a@example.com",
    description: "Desc",
  },
];

describe("CenterManagement", () => {
  const show = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    localStorage.setItem("roles", JSON.stringify(["admin"]));
    (useModal as jest.Mock).mockReturnValue({ show });
    (getCenterMembers as jest.Mock).mockResolvedValue({ success: true, data: [{ user: { username: "u1" } }, { user: { email: "e" } }] });
    (getAllCenters as jest.Mock).mockResolvedValue({ success: true, data: mockCenters });
    (createCenter as jest.Mock).mockResolvedValue({});
    (updateCenter as jest.Mock).mockResolvedValue({});
    (deleteCenter as jest.Mock).mockResolvedValue({});
  });

  it("renders centers, stats, and admin controls", async () => {
    renderComponent();

    await waitFor(() => {
      expect(getAllCenters).toHaveBeenCalled();
    });

    await screen.findAllByText("Center A");
    expect(getCenterMembers).toHaveBeenCalledWith("c1");
    expect(screen.getByText(/Total Centers/i)).toBeInTheDocument();
    expect(screen.getByText(/Create New Center/i)).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => element?.textContent?.trim() === "2 members")
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent?.replace(/\s+/g, " ").trim() === "0 groups")
    ).toBeInTheDocument();
  });

  it("shows empty state when no centers", async () => {
    (getAllCenters as jest.Mock).mockResolvedValueOnce({ success: true, data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No centers found/i)).toBeInTheDocument();
    });
  });

  it("surfaces fetch error via modal", async () => {
    (getAllCenters as jest.Mock).mockRejectedValueOnce(new Error("fail"));

    renderComponent();

    await waitFor(() => {
      expect(show).toHaveBeenCalledWith({
        title: "Error",
        message: "Unable to load centers list",
        variant: "error",
      });
    });
  });

  it("creates center through modal", async () => {
    (getAllCenters as jest.Mock)
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: mockCenters });

    renderComponent();

    fireEvent.click(await screen.findByText(/Create New Center/i));
    fireEvent.change(screen.getByPlaceholderText(/Enter center name/i), { target: { value: "New Center" } });
    fireEvent.submit(screen.getByText(/Create Center/i).closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(createCenter).toHaveBeenCalledWith({
        name: "New Center",
        address: "",
        description: "",
        status: "active",
        phone: "",
        email: "",
      });
    });

    expect(getAllCenters).toHaveBeenCalledTimes(2);
  });

  it("deletes center after confirmation", async () => {
    renderComponent();

    await screen.findAllByText("Center A");
    const deleteButtons = screen.getAllByText(/Delete/i);
    fireEvent.click(deleteButtons[0]);
    const confirmButtons = screen.getAllByRole("button", { name: /^Delete$/ });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(deleteCenter).toHaveBeenCalledWith("c1");
    });
  });

  it("validates required name before submit", async () => {
    renderComponent();

    await screen.findByText(/Create New Center/i);
    fireEvent.click(screen.getByText(/Create New Center/i));

    const form = screen.getByText(/Create Center/i).closest("form");
    expect(form).toBeTruthy();

    fireEvent.submit(form as Element);

    await waitFor(() =>
      expect(show).toHaveBeenCalledWith({
        title: "Error",
        message: "Center name cannot be empty",
        variant: "error",
      })
    );
    expect(createCenter).not.toHaveBeenCalled();
  });

  it("updates center through edit flow", async () => {
    renderComponent();

    await screen.findAllByText("Center A");

    fireEvent.click(screen.getAllByText(/Edit/i)[0]);

    const nameInput = screen.getByPlaceholderText(/Enter center name/i);
    fireEvent.change(nameInput, { target: { value: "Center A Edited" } });

    fireEvent.click(screen.getByText(/Update Center/i));

    await waitFor(() =>
      expect(updateCenter).toHaveBeenCalledWith("c1", expect.objectContaining({ name: "Center A Edited" }))
    );
    await waitFor(() => expect(screen.getByTestId("toast")).toHaveTextContent(/Successfully updated!/i));
  });

  it("filters centers by search term", async () => {
    renderComponent();

    await screen.findAllByText("Center A");

    fireEvent.change(screen.getByPlaceholderText(/Search centers/i), { target: { value: "unknown" } });

    await waitFor(() => expect(screen.getByText(/No centers found/i)).toBeInTheDocument());
  });
});