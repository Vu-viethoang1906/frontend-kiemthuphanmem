import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

let mockLocationPathname = "/dashboard/work-control/work-forecast";
const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    __esModule: true,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockLocationPathname }),
  }),
  { virtual: true }
);

jest.mock("../../../pages/QualityControl/WorkForecast", () => () => (
  <div data-testid="work-forecast">WorkForecast content</div>
));
jest.mock("../../../pages/QualityControl/ExportReports", () => () => (
  <div data-testid="export-reports">ExportReports content</div>
));
jest.mock("../../../pages/QualityControl/OverdueAnalysis", () => () => (
  <div data-testid="overdue-analysis">OverdueAnalysis content</div>
));
jest.mock("../../../pages/QualityControl/CollaborationIndex", () => () => (
  <div data-testid="collaboration-index">CollaborationIndex content</div>
));
jest.mock("../../../pages/QualityControl/TaskQualityMetrics", () => () => (
  <div data-testid="task-quality-metrics">TaskQualityMetrics content</div>
));

import WorkControl from "../../../pages/QualityControl/WorkControl";

describe("WorkControl", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLocationPathname = "/dashboard/work-control/work-forecast";
  });

  const renderWithPath = (path: string) => {
    mockLocationPathname = path;
    return render(<WorkControl />);
  };

  it("renders tabs and shows active content for the current path", () => {
    renderWithPath("/dashboard/work-control/overdue-analysis");

    expect(screen.getByText("Work Control")).toBeInTheDocument();
    expect(screen.getByTestId("overdue-analysis")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Work Forecast|Export Reports|Overdue Analysis|Collaboration Index|Task Quality Metrics/ })
    ).toHaveLength(5);
  });

  it("navigates using the computed base path", () => {
    renderWithPath("/admin/work-control/export-reports");

    fireEvent.click(screen.getByRole("button", { name: "Collaboration Index" }));

    expect(mockNavigate).toHaveBeenCalledWith("/admin/work-control/collaboration-index");
  });

  it("falls back to the first tab when the path does not match any tab", () => {
    renderWithPath("/dashboard/work-control/not-real");

    expect(screen.getByTestId("work-forecast")).toBeInTheDocument();
  });
});
