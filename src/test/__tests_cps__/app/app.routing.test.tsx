import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Virtual mock of react-router-dom to avoid ESM resolution and to control navigation
const mockNavigate = jest.fn();
let mockPathname = "/";
const mockSearchParams = new URLSearchParams();
const mockSetSearchParams = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    Navigate: ({ to }: any) => <div>Navigate to {to}</div>,
    Routes: ({ children }: any) => <div>{children}</div>,
    Route: ({ element }: any) => <div>{element}</div>,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname }),
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
    useParams: () => ({ id: "test-id" }),
  }),
  { virtual: true }
);

// Mock Keycloak hook to avoid requiring a Provider
jest.mock("@react-keycloak/web", () => ({
  useKeycloak: () => ({
    initialized: true,
    keycloak: {
      login: jest.fn(),
      logout: jest.fn(),
      authenticated: false,
      token: null,
      refreshToken: null,
      tokenParsed: {},
    },
  }),
}));

// Mock HelpButton which pulls in components using useAuth (Keycloak)
jest.mock("../../../components/HelpButton/HelpButton", () => () => null);

// Mock socket to avoid real connections
jest.mock("../../../socket", () => ({
  socket: { on: jest.fn(), off: jest.fn(), emit: jest.fn(), connected: false },
}));

// Mock heavy pages with lightweight components
jest.mock("../../../pages/Login/Login", () => () => <div>Login Page</div>);
jest.mock("../../../pages/Login/CodeGymLogin", () => () => (
  <div>CodeGym Login</div>
));
jest.mock("../../../pages/Settings/GoogleCalendarCallback", () => () => (
  <div>Google Calendar Callback</div>
));
jest.mock("../../../pages/Reports/ActivityTask", () => () => (
  <div>Activity Logs</div>
));
jest.mock("../../../pages/DashBoard/Dashboard", () => ({ children }: any) => (
  <div>Dashboard Layout{children}</div>
));
jest.mock("../../../pages/DashBoard/DashboardHome", () => () => (
  <div>Dashboard Home</div>
));
jest.mock("../../../pages/Admin/Admin", () => ({ children }: any) => (
  <div>Admin Layout{children}</div>
));
jest.mock("../../../pages/Admin/AdminHome", () => () => <div>Admin Home</div>);
jest.mock("../../../components/ProtectedRoute", () => ({ children }: any) => (
  <>{children}</>
));

import App from "../../../App";

describe("App routing redirects", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects to /login when no token", async () => {
    mockPathname = "/";
    render(<App />);

    await waitFor(() => {
      const nodes = screen.getAllByText(/Navigate to \/login/);
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  it("redirects to /dashboard when token present and non-admin hits /login", async () => {
    localStorage.setItem("token", "t");
    localStorage.setItem("roles", JSON.stringify(["user"]));

    mockPathname = "/login";
    render(<App />);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true })
    );
  });

  it("redirects admin to /admin when token present and visiting /login", async () => {
    localStorage.setItem("token", "t");
    localStorage.setItem("roles", JSON.stringify(["admin"]));

    mockPathname = "/login";
    render(<App />);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true })
    );
  });

  it("renders nested dashboard child route when token is present", async () => {
    localStorage.setItem("token", "t");
    localStorage.setItem("roles", JSON.stringify(["user"]));

    mockPathname = "/dashboard";
    render(<App />);

    await waitFor(() =>
      expect(mockNavigate).not.toHaveBeenCalledWith("/login", expect.anything())
    );
  });
});
