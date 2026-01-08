import axiosInstance from "./axiosInstance";

export interface ApiKey {
  _id: string;
  key: string;
  description: string;
  revoked: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface ApiResponse<T> {
  data: T[];
  success?: boolean;
  message?: string;
}

// Get all API keys
export const fetchAllApiKey = async (): Promise<ApiResponse<ApiKey>> => {
  const res = await axiosInstance.get<ApiResponse<ApiKey>>("/apiKey/");
  return res.data;
};

// Create a new API key
export const createApiKey = async (data: {
  description: string;
  key: string;
}): Promise<ApiResponse<ApiKey>> => {
  const res = await axiosInstance.post<ApiResponse<ApiKey>>("/apiKey/", data);
  return res.data;
};

// Delete (revoke) an API key
export const deleteApiKey = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/apiKey/${id}`);
};

// Update an API key (e.g., to revoke or update description)
export const updateApiKey = async (
  id: string,
  data: { description?: string; revoked?: boolean }
): Promise<ApiKey> => {
  const res = await axiosInstance.put<ApiKey>(`/apiKey/${id}`, data);
  return res.data;
};
