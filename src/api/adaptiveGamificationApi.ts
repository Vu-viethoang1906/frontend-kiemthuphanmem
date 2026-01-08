import axiosInstance from "./axiosInstance";

export interface MotivationProfile {
  competitive_score: number;
  collaborative_score: number;
  short_term_score: number;
  long_term_score: number;
  confidence: number;
  onboarding_stage: 'AWAITING_INITIAL_DATA' | 'TESTING_COMPETITIVE' | 'TESTING_COLLABORATIVE' | 'TESTING_SHORT_TERM' | 'TESTING_LONG_TERM' | 'STABLE';
  insights: string[];
  recommendations: string[];
  last_updated?: string;
}

export interface Personalization {
  current_strategy: string;
  leaderboard_weight: number;
  badges_weight: number;
  points_weight: number;
  goals_weight: number;
  recommended_badge_categories: string[];
  reward_multipliers: {
    competitive: number;
    collaborative: number;
    short_term: number;
    long_term: number;
  };
  personalized_messages: string[];
  last_adaptation_date?: string;
  skip_reason?: string;
}

export interface Badge {
  _id: string;
  name: string;
  description: string;
  icon_url?: string;
  category: string;
  points_reward: number;
  is_active?: boolean;
  adjusted_points_reward?: number;
  is_recommended?: boolean;
  priority?: number;
  multiplier_applied?: number;
}

export interface UserBadge {
  _id: string;
  name: string;
  description: string;
  icon_url?: string;
  category: string;
  earned_at: string;
  metadata?: any;
}

export interface RecentBadge {
  user: {
    _id: string;
    username: string;
    full_name?: string;
  };
  badge: {
    _id: string;
    name: string;
    icon_url?: string;
    category: string;
  };
  earned_at: string;
}

export interface BehaviorStats {
  leaderboard_views: number;
  leaderboard_positions_focused: number[];
  points_interactions: number;
  points_value_changes: number[];
  task_completions: number;
  task_completion_times: number[];
  collaboration_events: number;
  team_task_count: number;
  daily_activity: Array<{ date: string; count: number }>;
  weekly_goals_achieved: number;
  monthly_goals_achieved: number;
  badge_reactions: string[];
  notification_clicks: number;
}

export interface AdaptiveGamificationDashboard {
  user_id: string;
  center_id: string;
  motivation_profile: MotivationProfile;
  personalization: Personalization;
  my_badges: {
    total: number;
    badges: UserBadge[];
  };
  recent_badges: {
    total: number;
    badges: RecentBadge[];
  };
  behavior: {
    stats: BehaviorStats;
    analytics: {
      total_events: number;
      stats: BehaviorStats;
      period_days: number;
    };
    period_days: number;
  };
  available_badges: {
    total: number;
    badges: Badge[];
  };
  personalized_badges: {
    total: number;
    recommended: Badge[];
    badges: Badge[];
  };
}

/**
 * Get adaptive gamification dashboard
 */
export const getAdaptiveGamificationDashboard = async (
  centerId?: string,
  days: number = 30,
  recentLimit: number = 10
): Promise<AdaptiveGamificationDashboard> => {
  const params = new URLSearchParams();
  if (centerId) params.append('center_id', centerId);
  params.append('days', days.toString());
  params.append('recent_limit', recentLimit.toString());

  const res = await axiosInstance.get<{ success: boolean; data: AdaptiveGamificationDashboard }>(
    `/adaptive-gamification?${params.toString()}`
  );
  return res.data.data;
};

/**
 * Track user behavior
 */
export const trackBehavior = async (
  centerId: string,
  actionType: string,
  elementType?: string,
  metadata?: any
): Promise<void> => {
  const params = new URLSearchParams();
  params.append('center_id', centerId);
  params.append('action_type', actionType);
  if (elementType) params.append('element_type', elementType);
  if (metadata) params.append('metadata', JSON.stringify(metadata));

  await axiosInstance.get(`/adaptive-gamification/track-behavior?${params.toString()}`);
};

/**
 * Analyze user behavior
 */
export const analyzeBehavior = async (centerId?: string, userId?: string): Promise<MotivationProfile> => {
  const params = new URLSearchParams();
  if (centerId) params.append('center_id', centerId);
  if (userId) params.append('user_id', userId);

  const res = await axiosInstance.get<{ success: boolean; data: MotivationProfile }>(
    `/adaptive-gamification/analyze?${params.toString()}`
  );
  return res.data.data;
};

/**
 * Get motivation profile
 */
export const getMotivationProfile = async (centerId?: string): Promise<MotivationProfile> => {
  const params = new URLSearchParams();
  if (centerId) params.append('center_id', centerId);

  const res = await axiosInstance.get<{ success: boolean; data: MotivationProfile }>(
    `/adaptive-gamification/profile?${params.toString()}`
  );
  return res.data.data;
};

/**
 * Update motivation profile
 */
export const updateMotivationProfile = async (centerId?: string): Promise<MotivationProfile> => {
  const params = new URLSearchParams();
  if (centerId) params.append('center_id', centerId);

  const res = await axiosInstance.put<{ success: boolean; data: MotivationProfile }>(
    `/adaptive-gamification/profile?${params.toString()}`
  );
  return res.data.data;
};

/**
 * Get personalized gamification
 */
export const getPersonalizedGamification = async (centerId?: string): Promise<{
  motivation_profile: MotivationProfile;
  personalization: Personalization;
}> => {
  const params = new URLSearchParams();
  if (centerId) params.append('center_id', centerId);

  const res = await axiosInstance.get<{
    success: boolean;
    data: { motivation_profile: MotivationProfile; personalization: Personalization };
  }>(`/adaptive-gamification/personalized?${params.toString()}`);
  return res.data.data;
};

/**
 * Get behavior analytics
 */
export const getBehaviorAnalytics = async (centerId?: string, period: number = 30) => {
  const params = new URLSearchParams();
  if (centerId) params.append('center_id', centerId);
  params.append('period', period.toString());

  const res = await axiosInstance.get(`/adaptive-gamification/behavior/analytics?${params.toString()}`);
  return res.data.data;
};

/**
 * Get behavior stats
 */
export const getBehaviorStats = async (centerId?: string, days: number = 30): Promise<BehaviorStats> => {
  const params = new URLSearchParams();
  if (centerId) params.append('center_id', centerId);
  params.append('days', days.toString());

  const res = await axiosInstance.get<{ success: boolean; data: BehaviorStats }>(
    `/adaptive-gamification/behavior/stats?${params.toString()}`
  );
  return res.data.data;
};

/**
 * Adjust rewards
 */
export const adjustRewards = async (centerId: string, action: string) => {
  const res = await axiosInstance.post(`/adaptive-gamification/adjust-rewards`, {
    center_id: centerId,
    action,
  });
  return res.data.data;
};

