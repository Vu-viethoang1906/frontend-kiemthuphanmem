import axiosInstance from "./axiosInstance";

// CRUD Group
export const createGroup = async (data: any) => {
  const res = await axiosInstance.post("/groups", data);
  return res.data;
};

export const getAllGroups = async (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  center_id?: string;
  search?: string;
}) => {
  const res = await axiosInstance.get("/groups", { params });
  return res.data;
};

export const getGroupById = async (id: string) => {
  const res = await axiosInstance.get(`/groups/${id}`);
  return res.data;
};

export const updateGroup = async (id: string, data: any) => {
  const res = await axiosInstance.put(`/groups/${id}`, data);
  return res.data;
};

export const deleteGroup = async (id: string) => {
  const res = await axiosInstance.delete(`/groups/${id}`);
  return res.data;
};

// Group Member APIs
// Add single member
export const addGroupMember = async (data: any) => {
  const res = await axiosInstance.post("/groupMember", data);
  return res.data;
};

// Add multiple members at once
export const addBulkGroupMembers = async (data: { group_id: string; members: Array<{ user_id: string; role_in_group?: string }> }) => {
  const res = await axiosInstance.post("/groupMember", data);
  return res.data;
};

export const getGroupMembers = async (group_id: string) => {
  const res = await axiosInstance.get(`/groupMember/${group_id}`);
  return res.data;
};

export const updateGroupMemberRole = async (data: any) => {
  const res = await axiosInstance.put("/groupMember/member", data);
  return res.data;
};

export const removeGroupMember = async (data: any) => {
  const res = await axiosInstance.delete("/groupMember", { data });
  return res.data;
};

export const getAllGroupMembers = async () => {
  const res = await axiosInstance.get("/groupMember");
  return res.data;
};