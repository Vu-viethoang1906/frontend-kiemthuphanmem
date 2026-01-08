import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

const mockToast = { success: jest.fn(), error: jest.fn() };

jest.mock("react-hot-toast", () => mockToast);

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/templates", search: "" }),
  useNavigate: () => jest.fn(),
}), { virtual: true });

// Keep hooks deterministic for filtering/sorting without touching the real URL
jest.mock("../../hooks/useUrlState", () => {
  const React = require("react");
  return {
    useUrlState: (initial: any) => React.useState(initial),
  };
});

jest.mock("../../hooks/useVietnameseSearch", () => {
  const React = require("react");
  return {
    useVietnameseSearch: () => {
      const [searchValue, setSearchValue] = React.useState("");
      const [searchTerm, setSearchTerm] = React.useState("");
      return {
        searchValue,
        searchTerm,
        handleInputChange: (event: any) => {
          const value = event?.target?.value ?? "";
          setSearchValue(value);
          setSearchTerm(value);
        },
        handleCompositionStart: jest.fn(),
        handleCompositionEnd: jest.fn(),
      };
    },
  };
});

jest.mock("../../components/ModalProvider", () => ({
  useModal: () => ({
    show: jest.fn(),
    confirm: jest.fn().mockResolvedValue(true),
  }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockTemplateApi = {
  fetchTemplates: jest.fn(),
  createTemplate: jest.fn(),
  updateTemplate: jest.fn(),
  deleteTemplate: jest.fn(),
  fetchTemplateColumns: jest.fn(),
  createTemplateColumn: jest.fn(),
  updateTemplateColumn: jest.fn(),
  deleteTemplateColumn: jest.fn(),
  fetchTemplateSwimlanes: jest.fn(),
  createTemplateSwimlane: jest.fn(),
  updateTemplateSwimlane: jest.fn(),
  deleteTemplateSwimlane: jest.fn(),
};

jest.mock("../../api/templateApi", () => mockTemplateApi);

const TemplateManagement = require("../../pages/Template/TemplateManagement").default;
const { ModalProvider } = require("../../components/ModalProvider");

const renderPage = () => render(
  <ModalProvider>
    <TemplateManagement />
  </ModalProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

test("renders list view and opens detail", async () => {
  mockTemplateApi.fetchTemplates.mockResolvedValue([
    { id: "t1", name: "Template Alpha", description: "Desc A", created_at: "2024-01-01" },
    { id: "t2", name: "Template Beta", description: "Desc B", created_at: "2024-02-02" },
  ]);
  mockTemplateApi.fetchTemplateColumns.mockResolvedValue([
    { id: "c1", name: "Todo", order: 1 },
    { id: "c2", name: "Doing", order: 2 },
  ]);
  mockTemplateApi.fetchTemplateSwimlanes.mockResolvedValue([
    { id: "s1", name: "Default", order: 1 },
  ]);

  renderPage();

  expect(await screen.findByText("Template Alpha")).toBeInTheDocument();
  expect(screen.getByText(/Total Templates/i)).toHaveTextContent("2");

  await userEvent.click(screen.getByText("Template Alpha"));

  expect(await screen.findByRole("heading", { name: "Columns" })).toBeInTheDocument();
  expect(await screen.findByText("Todo")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: /Swimlanes/i }));
  expect(await screen.findByText("Default")).toBeInTheDocument();
});

test("shows empty state and can open create modal", async () => {
  mockTemplateApi.fetchTemplates.mockResolvedValue([]);

  renderPage();

  expect(await screen.findByText(/No Templates Yet/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Create Template/i }));
  expect(await screen.findByRole("dialog", { name: /Create New Template/i })).toBeInTheDocument();
});

test("shows permission error when fetch returns 403", async () => {
  mockTemplateApi.fetchTemplates.mockRejectedValue({ response: { status: 403 } });

  renderPage();

  expect(await screen.findByText(/Access Denied/i)).toBeInTheDocument();
  await waitFor(() => expect(mockToast.error).toHaveBeenCalled());
});
