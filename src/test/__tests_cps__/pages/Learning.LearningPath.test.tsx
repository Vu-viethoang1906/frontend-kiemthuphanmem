import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockGetLearningPath = jest.fn();
const mockGenerateLearningPath = jest.fn();
const mockGetSkillRecommendations = jest.fn();
const mockAcceptRecommendation = jest.fn();
const mockGetLearningPathProgress = jest.fn();
const mockCompleteStage = jest.fn();
const mockGetCenters = jest.fn();
const mockToast = { success: jest.fn(), error: jest.fn() };

jest.mock("../../../../src/api/learningPathApi", () => ({
  __esModule: true,
  getLearningPath: (...args: any[]) => mockGetLearningPath(...args),
  generateLearningPath: (...args: any[]) => mockGenerateLearningPath(...args),
  getSkillRecommendations: (...args: any[]) => mockGetSkillRecommendations(...args),
  acceptRecommendation: (...args: any[]) => mockAcceptRecommendation(...args),
  getLearningPathProgress: (...args: any[]) => mockGetLearningPathProgress(...args),
  completeStage: (...args: any[]) => mockCompleteStage(...args),
}));

jest.mock("../../../../src/api/centerApi", () => ({
  __esModule: true,
  getAllCenters: (...args: any[]) => mockGetCenters(...args),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: mockToast,
}));

jest.mock("framer-motion", () => ({
  __esModule: true,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe("LearningPath page", () => {
  const center = { _id: "c1", name: "Center 1" };
  const baseProgress = {
    progress_percentage: 40,
    current_stage: 1,
    total_stages: 3,
    completed_stages: 1,
  };
  const basePath = {
    _id: "lp1",
    path_name: "My Path",
    status: "active",
    current_stage: 1,
    stages: [
      {
        stage_number: 1,
        title: "Stage One",
        description: "Desc",
        difficulty_level: 3,
        estimated_duration_days: 5,
        is_completed: false,
        skills: [{ _id: "s1", name: "Skill 1" }],
        suggested_tasks: [{ _id: "t1", title: "Task 1" }],
      },
      {
        stage_number: 2,
        title: "Stage Two",
        description: "Desc 2",
        difficulty_level: 2,
        estimated_duration_days: 3,
        is_completed: true,
        skills: [],
        suggested_tasks: [],
      },
    ],
  } as any;
  const recs = [
    {
      _id: "rec1",
      recommended_skill_id: { name: "Skill Rec" },
      reason: "Because",
      priority: 5,
      confidence_score: 80,
      suggested_tasks: [{ _id: "st1", title: "Sub Task" }],
      accepted: false,
    },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCenters.mockResolvedValue({ success: true, data: [center] });
    mockGetLearningPath.mockResolvedValue(basePath);
    mockGetSkillRecommendations.mockResolvedValue(recs);
    mockGetLearningPathProgress.mockResolvedValue(baseProgress);
    mockGenerateLearningPath.mockResolvedValue(basePath);
    mockAcceptRecommendation.mockResolvedValue({});
    mockCompleteStage.mockResolvedValue({ ...basePath, current_stage: 2 });
  });

  const renderPage = async () => {
    const { default: Page } = await import("../../../../src/pages/Learning/LearningPath");
    return render(<Page />);
  };

  it("renders learning path, completes stage, and accepts recommendation", async () => {
    await renderPage();

    // Multiple elements contain "Learning Path" text (h1 and p), so use getAllByText
    const learningPathElements = await screen.findAllByText(/Learning Path/i);
    expect(learningPathElements.length).toBeGreaterThan(0);
    
    await waitFor(() => {
      expect(mockGetLearningPath).toHaveBeenCalledWith("c1");
      expect(mockGetSkillRecommendations).toHaveBeenCalledWith("c1", 10);
      expect(mockGetLearningPathProgress).toHaveBeenCalledWith("c1");
    });

    expect(await screen.findByText("Stage One")).toBeInTheDocument();
    // Wait for recommendations to load and render
    await waitFor(() => {
      expect(screen.getByText("Skill Rec")).toBeInTheDocument();
    });

    const completeBtn = await screen.findByRole("button", { name: "Complete" });
    await userEvent.click(completeBtn);
    await waitFor(() => {
      expect(mockCompleteStage).toHaveBeenCalledWith("c1", 1);
      expect(mockToast.success).toHaveBeenCalledWith("Completed Stage 1!");
    });

    const acceptBtn = await screen.findByRole("button", { name: "Accept" });
    await userEvent.click(acceptBtn);
    await waitFor(() => {
      expect(mockAcceptRecommendation).toHaveBeenCalledWith("rec1");
      expect(mockToast.success).toHaveBeenCalledWith("Accepted recommendation!");
    });
  });

  it("shows empty state when no path and triggers generation", async () => {
    mockGetLearningPath.mockRejectedValueOnce(new Error("fail"));
    mockToast.error.mockClear();

    await renderPage();

    expect(await screen.findByText(/No learning path yet/i)).toBeInTheDocument();
    // Component only logs console.error, doesn't call toast.error when load fails

    await userEvent.click(screen.getByRole("button", { name: /Create Learning Path/i }));
    await waitFor(() => {
      expect(mockGenerateLearningPath).toHaveBeenCalledWith("c1");
      expect(mockToast.success).toHaveBeenCalledWith("Created learning path!");
    });
  });
});
