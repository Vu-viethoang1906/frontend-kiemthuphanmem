import axiosInstance from "./axiosInstance";

export interface Deployment {
  _id: string;
  version: string;
  environment: "production" | "staging" | "development";
  branch?: string;
  commit_hash?: string;
  commit_message?: string;
  deployed_by?: string;
  deployed_by_username?: string;
  status: "success" | "failed" | "in_progress" | "rolled_back";
  deployed_at: string;
  notes?: string;
  build_info?: {
    node_version?: string;
    npm_version?: string;
    build_time?: string;
  };
  rollback_to?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeploymentHistoryResponse {
  success: boolean;
  data: Deployment[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

// Lấy lịch sử deployment
export const getDeploymentHistory = async (params?: {
  environment?: string;
  status?: string;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<DeploymentHistoryResponse> => {
  const response = await axiosInstance.get("/deployments/history", { params });
  return response.data;
};

// Lấy deployment hiện tại đang chạy trên production
export const getCurrentProductionDeployment = async () => {
  const response = await axiosInstance.get("/deployments/current-production");
  return response.data;
};

// Lấy version hiện tại
export const getCurrentVersion = async () => {
  const response = await axiosInstance.get("/deployments/current-version");
  return response.data;
};

// Lấy thông tin một deployment cụ thể
export const getDeploymentById = async (deploymentId: string) => {
  const response = await axiosInstance.get(`/deployments/${deploymentId}`);
  return response.data;
};

