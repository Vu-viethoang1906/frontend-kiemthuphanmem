import axiosInstance from "./axiosInstance";
import { boardCache } from "../utils/boardCache";

export const fetchMyBoards = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  is_template?: boolean;
  search?: string;
}) => {
  const cacheParams = params || {};
  const cached = boardCache.get(cacheParams);
  
  if (cached) {
    return {
      data: cached.data,
      pagination: cached.pagination,
      fromCache: true,
    };
  }

  const res = await axiosInstance.get("/boards/my", { params });
  const responseData = res.data;
  
  boardCache.set(
    cacheParams,
    responseData?.data || [],
    responseData?.pagination
  );

  return {
    ...responseData,
    fromCache: false,
  };
};

export const fetchBoardMember = async (idUser: string, idGroup: string) => {
  const res = await axiosInstance.post(`/groups/getBoarMember`, {
    idUser,
    idGroup,
  });

  return res.data;
};

export const fetchBoardById = async (id: string) => {
  const res = await axiosInstance.get(`/boards/${id}`);
  return res.data;
};

export const createBoard = async (data: any) => {
  const res = await axiosInstance.post("/boards", data);
  boardCache.invalidate();
  return res.data;
};

export const updateBoard = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/boards/${id}`, data);
  boardCache.invalidate();
  return res.data;
};

export const deleteBoard = async (id: string) => {
  const res = await axiosInstance.delete(`/boards/${id}`);
  boardCache.invalidate();
  return res.data;
};

export const cloneBoardFromTemplate = async (
  templateId: string,
  data: { title: string; description?: string; userId: string }
) => {
  const res = await axiosInstance.post(`/boards/clone/${templateId}`, data);
  boardCache.invalidate();
  return res.data;
};

// Configure board settings
export const configureBoardSettings = async (
  id: string,
  data: { settings: any }
) => {
  const res = await axiosInstance.put(`/boards/${id}/settings`, data);
  return res.data;
};

// Toggle swimlane collapse
export const toggleBoardSwimlane = async (
  boardId: string,
  swimlaneId: string
) => {
  const res = await axiosInstance.put(
    `/boards/${boardId}/swimlanes/${swimlaneId}/toggle`
  );
  return res.data;
};
