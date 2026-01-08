import axiosInstance from "./axiosInstance";

export interface LearningResource {
  _id: string;
  title: string;
  description?: string;
  url: string;
  resource_type: "tutorial" | "video" | "article" | "docs" | "blog" | "code_example" | "course" | "book";
  language?: string;
  snippet?: string;
  tags?: string[];
  skills?: Array<{
    _id: string;
    name: string;
    category?: string;
  }>;
  difficulty_level?: number;
  duration_minutes?: number;
  author?: string;
  source?: string;
  view_count?: number;
  rating?: number;
  is_featured?: boolean;
  is_active?: boolean;
  created_by?: {
    _id: string;
    username: string;
    full_name?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface LearningResourceRecommendations {
  tutorials: LearningResource[];
  videos: LearningResource[];
  codeExamples: LearningResource[];
}

export interface AIRecommendation {
  tutorials: Array<{
    title: string;
    url: string;
    type: string;
  }>;
  videos: Array<{
    title: string;
    url: string;
  }>;
  codeExamples: Array<{
    title: string;
    language: string;
    snippet: string;
  }>;
}

/**
 * Get all learning resources
 */
export const getAllLearningResources = async (params?: {
  resource_type?: string;
  skill_id?: string;
  search?: string;
  limit?: number;
  skip?: number;
}): Promise<LearningResource[]> => {
  const res = await axiosInstance.get<{ status: string; data: LearningResource[] }>(
    "/learning-resources",
    { params }
  );
  return res.data.data;
};

/**
 * Get learning resource by ID
 */
export const getLearningResourceById = async (id: string): Promise<LearningResource> => {
  const res = await axiosInstance.get<{ status: string; data: LearningResource }>(
    `/learning-resources/${id}`
  );
  return res.data.data;
};

/**
 * Get recommendations for a task from database
 */
export const getRecommendationsForTask = async (
  taskId: string
): Promise<LearningResourceRecommendations> => {
  const res = await axiosInstance.post<{
    status: string;
    data: {
      task_id: string;
      task_title: string;
      recommendations: LearningResourceRecommendations;
    };
  }>("/learning-resources/recommend-for-task", { task_id: taskId });
  return res.data.data.recommendations;
};

/**
 * Get AI recommendations for a task
 */
export const getAIRecommendations = async (
  taskId: string,
  useDatabase: boolean = true
): Promise<{
  success: boolean;
  taskTitle: string;
  source: "database" | "ai" | "hybrid";
  tutorials?: Array<{ title: string; url: string; type?: string }>;
  videos?: Array<{ title: string; url: string }>;
  codeExamples?: Array<{ title: string; language: string; snippet: string }>;
}> => {
  const res = await axiosInstance.post<{
    status: string;
    data: {
      success: boolean;
      taskTitle: string;
      source: "database" | "ai" | "hybrid";
      tutorials?: Array<{ title: string; url: string; type?: string }>;
      videos?: Array<{ title: string; url: string }>;
      codeExamples?: Array<{ title: string; language: string; snippet: string }>;
    };
  }>("/nlp/recommend", { idTask: taskId, useDatabase });
  return res.data.data;
};

/**
 * Create learning resource (Admin only)
 */
export const createLearningResource = async (
  data: Partial<LearningResource>
): Promise<LearningResource> => {
  const res = await axiosInstance.post<{ status: string; data: LearningResource }>(
    "/learning-resources",
    data
  );
  return res.data.data;
};

/**
 * Update learning resource (Admin only)
 */
export const updateLearningResource = async (
  id: string,
  data: Partial<LearningResource>
): Promise<LearningResource> => {
  const res = await axiosInstance.put<{ status: string; data: LearningResource }>(
    `/learning-resources/${id}`,
    data
  );
  return res.data.data;
};

/**
 * Delete learning resource (Admin only)
 */
export const deleteLearningResource = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/learning-resources/${id}`);
};

