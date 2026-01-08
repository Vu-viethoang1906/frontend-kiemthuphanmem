import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserManagement from "../../../pages/Admin/UserManagement";
import toast from "react-hot-toast";
import * as userApi from "../../../api/userApi";
import * as roleApi from "../../../api/roleApi";
import * as centerApi from "../../../api/centerApi";
import * as centerMemberApi from "../../../api/centerMemberApi";

jest.setTimeout(15000);

const mockConfirm = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}), { virtual: true });

jest.mock("../../../components/ModalProvider", () => ({
  useModal: () => ({ confirm: mockConfirm, show: jest.fn() }),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../../../api/userApi");
jest.mock("../../../api/roleApi");
jest.mock("../../../api/centerApi");
jest.mock("../../../api/centerMemberApi");

const mockUsers = [
  {
    _id: "u1",
    username: "alice",
    email: "alice@gmail.com",
    full_name: "Alice",
    status: "active",
    roles: ["admin"],
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    _id: "u2",
    username: "bob",
    email: "bob@gmail.com",
    full_name: "Bob",
    status: "inactive",
    roles: ["user"],
    created_at: "2024-01-02T00:00:00Z",
  },
  {
    _id: "u2",
    username: "bob",
    email: "bob@gmail.com",
    full_name: "Bob",
    status: "inactive",
    roles: ["user"],
    created_at: "2024-02-02T00:00:00Z",
  },
];

const mockDeleted = [
  {
    _id: "d1",
    username: "deleted",
    email: "del@gmail.com",
    full_name: "Del User",
    status: "inactive",
    roles: ["user"],
    deleted_at: "2024-03-01T00:00:00Z",
  },
];

describe("Admin/UserManagement coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockResolvedValue(true);

    (roleApi.fetchAllRoles as jest.Mock).mockResolvedValue([
      { _id: "r1", name: "admin" },
      { _id: "r2", name: "user" },
    ]);

    (centerApi.getAllCenters as jest.Mock).mockResolvedValue({
      success: true,
      data: [
        { _id: "c1", name: "Center One" },
        { _id: "c2", name: "Center Two" },
      ],
    });

    (centerMemberApi.getCenterMembers as jest.Mock).mockResolvedValue({ data: [] });
    (centerMemberApi.addCenterMember as jest.Mock).mockResolvedValue({});
    (centerMemberApi.removeCenterMember as jest.Mock).mockResolvedValue({});

    (userApi.fetchAllUsers as jest.Mock).mockResolvedValue({
      success: true,
      users: mockUsers,
    });
    (userApi.fetchDeletedUsers as jest.Mock).mockResolvedValue({
      users: mockDeleted,
      pagination: { total: 1 },
    });
    (userApi.createUser as jest.Mock).mockResolvedValue({ _id: "new-user" });
    (userApi.updateUser as jest.Mock).mockResolvedValue({});
    (userApi.deleteUser as jest.Mock).mockResolvedValue({});
    (userApi.restoreUser as jest.Mock).mockResolvedValue({});
  });

  it("blocks save when email invalid and password missing", async () => {
    render(<UserManagement />);
    await screen.findByText(/User Management/i);

    const [openCreateBtn] = screen.getAllByRole("button", { name: /create user/i });
    await userEvent.click(openCreateBtn);

    await userEvent.type(screen.getByPlaceholderText(/enter username/i), "newuser");
    await userEvent.type(screen.getByPlaceholderText(/enter full name/i), "New User");
    await userEvent.type(screen.getByPlaceholderText(/enter email address/i), "bad-email");

    const modalHeading = await screen.findByText(/create user/i, { selector: "h2" });
    const modal = modalHeading.closest(".fixed") as HTMLElement;
    const submitCreateBtn = within(modal).getByRole("button", { name: /create user/i });

    await userEvent.click(submitCreateBtn);

    expect((toast as any).error).toHaveBeenCalled();
    expect(userApi.createUser).not.toHaveBeenCalled();

    // Fix email but leave password empty -> still blocks
    await userEvent.clear(screen.getByPlaceholderText(/enter email address/i));
    await userEvent.type(screen.getByPlaceholderText(/enter email address/i), "ok@gmail.com");
    await userEvent.click(submitCreateBtn);
    expect((toast as any).error).toHaveBeenCalled();
    expect(userApi.createUser).not.toHaveBeenCalled();
  });

  it("creates user with center assignment", async () => {
    render(<UserManagement />);
    await screen.findByText(/User Management/i);

    const [openCreateBtn] = screen.getAllByRole("button", { name: /create user/i });
    await userEvent.click(openCreateBtn);
    await userEvent.type(screen.getByPlaceholderText(/enter username/i), "jane");
    await userEvent.type(screen.getByPlaceholderText(/enter full name/i), "Jane Doe");
    await userEvent.type(screen.getByPlaceholderText(/enter email address/i), "jane@gmail.com");
    await userEvent.type(screen.getByPlaceholderText(/enter password/i), "secret123");

    const modalHeading = await screen.findByText(/create user/i, { selector: "h2" });
    const modal = modalHeading.closest(".fixed") as HTMLElement;
    const submitCreateBtn = within(modal).getByRole("button", { name: /create user/i });

    const selects = within(modal).getAllByRole("combobox");
    const roleSelect = selects.find((el) =>
      Array.from(el.querySelectorAll("option")).some((o) => o.value === "admin")
    ) as HTMLSelectElement;
    const centerSelect = selects.find((el) =>
      Array.from(el.querySelectorAll("option")).some((o) => o.value === "c1") && el !== roleSelect
    ) as HTMLSelectElement;

    await userEvent.selectOptions(roleSelect, "admin");
    await userEvent.selectOptions(centerSelect, "c1");

    await userEvent.click(submitCreateBtn);

    await waitFor(() => expect(userApi.createUser).toHaveBeenCalled());
    await waitFor(() => expect(centerMemberApi.addCenterMember).toHaveBeenCalled());
    expect(centerMemberApi.addCenterMember).toHaveBeenCalledWith({
      center_id: "c1",
      user_id: "new-user",
      role_in_center: "Member",
    });
  });

  it("restores user from deleted tab after confirm", async () => {
    render(<UserManagement />);
    await screen.findByText(/User Management/i);

    await userEvent.click(screen.getByRole("button", { name: /deleted users/i }));
    const restoreButton = await screen.findByTitle(/restore user/i);
    await userEvent.click(restoreButton);

    await waitFor(() => expect(userApi.restoreUser).toHaveBeenCalledWith("d1"));
  });

  it("assigns center via change center modal", async () => {
    render(<UserManagement />);
    await screen.findByText(/User Management/i);

    // Assign center for user without center
    const assignButtons = await screen.findAllByTitle(/assign center/i);
    await userEvent.click(assignButtons[0]);

    await screen.findByRole("heading", { name: /change center/i });

    const centerSelect = screen.getAllByRole("combobox").pop() as HTMLSelectElement;
    await userEvent.selectOptions(centerSelect, "c2");

    const changeCenterBtn = screen.getAllByRole("button", { name: /change center/i }).pop() as HTMLButtonElement;
    await userEvent.click(changeCenterBtn);

    await waitFor(() => expect(centerMemberApi.addCenterMember).toHaveBeenCalledWith({
      center_id: "c2",
      user_id: "u1",
      role_in_center: "Member",
    }));
  });
});
