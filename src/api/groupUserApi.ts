import axiosInstance from "./axiosInstance";

export const getGroupsByUser = async (id_user: string) => {
  const res = await axiosInstance.post("/groupMember/getGroupUser", { id_user });
  return res.data;
};
