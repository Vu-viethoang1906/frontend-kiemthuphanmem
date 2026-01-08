import axiosInstance from "./axiosInstance";

export interface NotificationPreference {
  user_id: string;
  smart_scheduling_enabled: boolean;
  urgent_types: string[];
  min_delay_minutes: number;
  max_delay_minutes: number;
  quiet_hours: {
    enabled: boolean;
    start_hour: number;
    end_hour: number;
  };
  active_days: number[];
}

export interface UserActivityPattern {
  user_id: string;
  active_hours: number[];
  deep_work_periods: Array<{
    day_of_week: number;
    start_hour: number;
    end_hour: number;
  }>;
  optimal_notification_times: Array<{
    day_of_week: number;
    hours: number[];
  }>;
  metrics: {
    average_daily_active_hours: number;
    most_active_day: number;
    least_active_day: number;
    average_session_duration: number;
  };
  confidence_score: number;
  last_analyzed_at: string;
}

export const notificationPreferenceApi = {
  // Get user notification preferences
  getPreferences: async (): Promise<NotificationPreference> => {
    const response = await axiosInstance.get("/notification-preferences");
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (data: Partial<NotificationPreference>): Promise<NotificationPreference> => {
    const response = await axiosInstance.put("/notification-preferences", data);
    return response.data;
  },

  // Analyze user activity patterns
  analyzeActivity: async (days?: number): Promise<UserActivityPattern> => {
    const response = await axiosInstance.post("/notification-preferences/analyze-activity", {
      days: days || 30,
    });
    return response.data;
  },

  // Get user activity pattern
  getActivityPattern: async (): Promise<UserActivityPattern | null> => {
    try {
      const response = await axiosInstance.get("/notification-preferences/activity-pattern");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

