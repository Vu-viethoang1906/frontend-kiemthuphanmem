import axios from "axios";
import axiosInstance from "./axiosInstance";

export type SidebarMenuType = "main" | "personal" | "admin";

export interface SidebarItem {
  _id: string;
  menuType: SidebarMenuType;
  name: string;
  icon: string;
  path: string;
  badge?: number;
  requiredPermissions?: string[];
  order: number;
  isActive: boolean;
  isExpanded?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BasicSidebarKey =
  | "introduction"
  | "dashboard"
  | "projects"
  | "reports"
  | "groups"
  | "profile"
  | "settings"
  | "usermanagement"
  | "roleandpermission"
  | "permissionmanagement"
  | "templates"
  | "centers"
  | "userpoints";

export interface BasicSidebarConfig {
  key: BasicSidebarKey;
  label: string;
  path: string;
  name: string;
  icon: string;
  defaultIcon?: string;
  menuType?: "main" | "personal" | "admin";
  iconUrl?: string | null;
  itemId?: string | null;
  updatedAt?: string | null;
}

export interface SidebarApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Simplified sidebar config (only Dashboard/Projects/Reports/Groups)
export const getBasicSidebarConfig = async (): Promise<BasicSidebarConfig[]> => {
  const res = await axiosInstance.get<SidebarApiResponse<BasicSidebarConfig[]>>(
    "/sidebar-items/basic"
  );
  if (res.data.success && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Failed to fetch sidebar config");
};

export const updateBasicSidebarItem = async (
  key: BasicSidebarKey,
  payload: { name?: string; icon?: string }
): Promise<BasicSidebarConfig> => {
  const res = await axiosInstance.put<SidebarApiResponse<BasicSidebarConfig>>(
    `/sidebar-items/basic/${key}`,
    payload
  );
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Failed to update sidebar item");
};

export const uploadBasicSidebarIcon = async (
  key: BasicSidebarKey,
  file: File
): Promise<BasicSidebarConfig> => {
  const formData = new FormData();
  formData.append("icon", file);

  try {
    // Create a new axios instance for this request to avoid header conflicts
    const response = await axiosInstance.post<SidebarApiResponse<BasicSidebarConfig>>(
      `/sidebar-items/basic/${key}/icon`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to upload sidebar icon");
  } catch (error: any) {
    console.error('Error uploading icon:', error);
    let errorMessage = "Error occurred while uploading image. Please try again later.";
    
    if (error.response) {
      // Server responded with a status other than 2xx
      console.error('Server response error:', error.response.data);
      errorMessage = error.response.data?.message || errorMessage;
      
      // Handle 404 specifically
      if (error.response.status === 404) {
        errorMessage = `API not found: ${error.response.config?.url}. Please check the path or contact the administrator.`;
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error('No response received:', error.request);
      errorMessage = "No response from server. Please check your network connection.";
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    throw new Error(errorMessage);
  }
};

// Legacy helpers kept in case other screens still rely on them
export const getAllSidebarItems = async (): Promise<SidebarItem[]> => {
  const res = await axiosInstance.get<SidebarApiResponse<SidebarItem[]>>(
    "/sidebar-items"
  );
  if (res.data.success && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Failed to fetch sidebar items");
};

export const getMenuItems = async (
  menuType: SidebarMenuType
): Promise<SidebarItem[]> => {
  const res = await axiosInstance.get<SidebarApiResponse<SidebarItem[]>>(
    `/sidebar-items/menu/${menuType}`
  );
  if (res.data.success && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  return [];
};

export const updateSidebarItem = async (
  id: string,
  updateData: Partial<Omit<SidebarItem, "_id" | "createdAt" | "updatedAt">>
): Promise<SidebarItem> => {
  const res = await axiosInstance.put<SidebarApiResponse<SidebarItem>>(
    `/sidebar-items/${id}`,
    updateData
  );
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Failed to update sidebar item");
};

export const createSidebarItem = async (
  itemData: Omit<SidebarItem, "_id" | "createdAt" | "updatedAt">
): Promise<SidebarItem> => {
  const res = await axiosInstance.post<SidebarApiResponse<SidebarItem>>(
    "/sidebar-items",
    itemData
  );
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Failed to create sidebar item");
};

export const deleteSidebarItem = async (id: string): Promise<void> => {
  const res = await axiosInstance.delete<SidebarApiResponse>(
    `/sidebar-items/${id}`
  );
  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to delete sidebar item");
  }
};

export const updateMenuOrder = async (
  menuType: SidebarMenuType,
  order: string[]
): Promise<void> => {
  const res = await axiosInstance.put<SidebarApiResponse>(
    `/sidebar-items/${menuType}/order`,
    { order }
  );
  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to update menu order");
  }
};
