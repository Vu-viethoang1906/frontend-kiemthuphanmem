import {
  getLearningPath,
  generateLearningPath,
  getUserSkills,
  getSkillRecommendations,
  acceptRecommendation,
  getLearningPathProgress,
  completeStage,
} from "../../../api/learningPathApi";

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();

jest.mock("../../../api/axiosInstance", () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

describe("learningPathApi", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPut.mockReset();
  });

  it("gets learning path for center", async () => {
    const payload = { _id: "lp-1", current_stage: 2 } as any;
    mockGet.mockResolvedValue({ data: { success: true, data: payload } });

    const res = await getLearningPath("center-1");

    expect(mockGet).toHaveBeenCalledWith("/learning-path?center_id=center-1");
    expect(res).toEqual(payload);
  });

  it("generates learning path", async () => {
    const payload = { _id: "lp-2", stages: [] } as any;
    mockPost.mockResolvedValue({ data: { success: true, data: payload } });

    const res = await generateLearningPath("center-2");

    expect(mockPost).toHaveBeenCalledWith("/learning-path/generate", { center_id: "center-2" });
    expect(res).toEqual(payload);
  });

  it("gets user skills list", async () => {
    const skills = [{ _id: "skill-1" }, { _id: "skill-2" }] as any;
    mockGet.mockResolvedValue({ data: { success: true, data: { total: skills.length, skills } } });

    const res = await getUserSkills("center-3");

    expect(mockGet).toHaveBeenCalledWith("/learning-path/skills?center_id=center-3");
    expect(res).toEqual(skills);
  });

  it("gets skill recommendations with default and custom limits", async () => {
    const recommendations = [{ _id: "rec-1" }] as any;
    mockGet.mockResolvedValueOnce({ data: { success: true, data: { total: 1, recommendations } } });

    const defaultRes = await getSkillRecommendations("center-4");

    expect(mockGet).toHaveBeenCalledWith(
      "/learning-path/recommendations?center_id=center-4&limit=10"
    );
    expect(defaultRes).toEqual(recommendations);

    const customRecommendations = [{ _id: "rec-2" }] as any;
    mockGet.mockResolvedValueOnce({ data: { success: true, data: { total: 1, recommendations: customRecommendations } } });

    const customRes = await getSkillRecommendations("center-4", 25);

    expect(mockGet).toHaveBeenCalledWith(
      "/learning-path/recommendations?center_id=center-4&limit=25"
    );
    expect(customRes).toEqual(customRecommendations);
  });

  it("accepts a recommendation", async () => {
    mockPost.mockResolvedValue({ data: {} });

    await acceptRecommendation("rec-123");

    expect(mockPost).toHaveBeenCalledWith("/learning-path/recommendations/rec-123/accept");
  });

  it("gets learning path progress", async () => {
    const progress = { progress_percentage: 50, current_stage: 1, total_stages: 3, completed_stages: 1 };
    mockGet.mockResolvedValue({ data: { success: true, data: progress } });

    const res = await getLearningPathProgress("center-5");

    expect(mockGet).toHaveBeenCalledWith("/learning-path/progress?center_id=center-5");
    expect(res).toEqual(progress);
  });

  it("completes a stage", async () => {
    const payload = { current_stage: 3 } as any;
    mockPut.mockResolvedValue({ data: { success: true, data: payload } });

    const res = await completeStage("center-6", 2);

    expect(mockPut).toHaveBeenCalledWith("/learning-path/stage/2/complete", { center_id: "center-6" });
    expect(res).toEqual(payload);
  });
});
