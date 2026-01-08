import axiosInstance from "./axiosInstance";

export const getRoles = async (page = 1, pageSize = 5) => {
  const res = await axiosInstance.get(`/roles?page=${page}&pageSize=${pageSize}`);
  return res.data;
};

export const getUsers = async (page = 1, pageSize = 5) => {
  const res = await axiosInstance.get(`/users?page=${page}&pageSize=${pageSize}`);
  return res.data;
};
