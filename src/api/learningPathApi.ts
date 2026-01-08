import axiosInstance from "./axiosInstance";

export interface LearningPathStage {
  stage_number: number;
  title: string;
  description: string;
  skills: Array<{
    _id: string;
    name: string;
    category?: string;
    difficulty_level?: number;
  }>;
  suggested_tasks: Array<{
    _id: string;
    title: string;
    description?: string;
    priority?: string;
    due_date?: string;
  }>;
  difficulty_level: number;
  estimated_duration_days: number;
  is_completed: boolean;
  completed_at?: string;
}

export interface LearningPath {
  _id: string;
  user_id: string;
  center_id: string;
  path_name: string;
  current_stage: number;
  stages: LearningPathStage[];
  progress_percentage: number;
  status: 'active' | 'paused' | 'completed';
  started_at: string;
  target_completion_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SkillRecommendation {
  _id: string;
  recommended_skill_id: {
    _id: string;
    name: string;
    category?: string;
    difficulty_level?: number;
    description?: string;
  };
  recommendation_type: 'next_skill' | 'gap_filling' | 'advanced';
  priority: number;
  reason: string;
  confidence_score: number;
  prerequisites_met: boolean;
  estimated_difficulty: number;
  suggested_tasks: Array<{
    _id: string;
    title: string;
    description?: string;
  }>;
  accepted: boolean;
  created_at: string;
}

export interface UserSkill {
  _id: string;
  skill_id: {
    _id: string;
    name: string;
    category?: string;
    difficulty_level?: number;
  };
  proficiency_level: number;
  confidence_score: number;
  evidence_tasks: string[];
  learned_at?: string;
  last_practiced_at?: string;
  mastery_date?: string;
}

/**
 * Get learning path for current user
 */
export const getLearningPath = async (centerId: string): Promise<LearningPath> => {
  const res = await axiosInstance.get<{ success: boolean; data: LearningPath }>(
    `/learning-path?center_id=${centerId}`
  );
  return res.data.data;
};

/**
 * Generate new learning path
 */
export const generateLearningPath = async (centerId: string): Promise<LearningPath> => {
  const res = await axiosInstance.post<{ success: boolean; data: LearningPath }>(
    `/learning-path/generate`,
    { center_id: centerId }
  );
  return res.data.data;
};

/**
 * Get user skills
 */
export const getUserSkills = async (centerId: string): Promise<UserSkill[]> => {
  const res = await axiosInstance.get<{ success: boolean; data: { total: number; skills: UserSkill[] } }>(
    `/learning-path/skills?center_id=${centerId}`
  );
  return res.data.data.skills;
};

/**
 * Get skill recommendations
 */
export const getSkillRecommendations = async (
  centerId: string,
  limit: number = 10
): Promise<SkillRecommendation[]> => {
  const res = await axiosInstance.get<{
    success: boolean;
    data: { total: number; recommendations: SkillRecommendation[] };
  }>(`/learning-path/recommendations?center_id=${centerId}&limit=${limit}`);
  return res.data.data.recommendations;
};

/**
 * Accept a skill recommendation
 */
export const acceptRecommendation = async (recommendationId: string): Promise<void> => {
  await axiosInstance.post(`/learning-path/recommendations/${recommendationId}/accept`);
};

/**
 * Get learning path progress
 */
export const getLearningPathProgress = async (centerId: string) => {
  const res = await axiosInstance.get<{
    success: boolean;
    data: {
      progress_percentage: number;
      current_stage: number;
      total_stages: number;
      completed_stages: number;
    };
  }>(`/learning-path/progress?center_id=${centerId}`);
  return res.data.data;
};

/**
 * Complete a learning path stage
 */
export const completeStage = async (centerId: string, stageNumber: number): Promise<LearningPath> => {
  const res = await axiosInstance.put<{ success: boolean; data: LearningPath }>(
    `/learning-path/stage/${stageNumber}/complete`,
    { center_id: centerId }
  );
  return res.data.data;
};

