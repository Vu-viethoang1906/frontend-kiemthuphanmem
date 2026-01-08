import axiosInstance from "./axiosInstance";

// Interface cho GamificationConfig
export interface GamificationConfig {
  is_enabled: boolean;
  points_per_task: number;
  points_deduction: number;
  description?: string | null;
  updated_by?: string;
  updated_at?: string;
}

export interface UpdatePointsData {
  points_per_task: number;
  points_deduction: number;
}

// Lấy cấu hình gamification (mọi user đã đăng nhập)
export const getGamificationConfig = async (): Promise<{
  success: boolean;
  data: GamificationConfig;
}> => {
  const response = await axiosInstance.get("/gamification");
  return response.data;
};

// Bật gamification (admin only)
export const enableGamification = async (): Promise<{
  success: boolean;
  message: string;
  data: GamificationConfig;
}> => {
  const response = await axiosInstance.post("/gamification/enable");
  return response.data;
};

// Tắt gamification (admin only)
export const disableGamification = async (): Promise<{
  success: boolean;
  message: string;
  data: GamificationConfig;
}> => {
  const response = await axiosInstance.post("/gamification/disable");
  return response.data;
};

// Toggle gamification (admin only)
export const toggleGamification = async (): Promise<{
  success: boolean;
  message: string;
  data: GamificationConfig;
}> => {
  const response = await axiosInstance.post("/gamification/toggle");
  return response.data;
};

// Cập nhật điểm thưởng (admin only)
export const updateGamificationPoints = async (
  data: UpdatePointsData
): Promise<{
  success: boolean;
  message: string;
  data: GamificationConfig;
}> => {
  const response = await axiosInstance.put("/gamification/points", data);
  return response.data;
};

