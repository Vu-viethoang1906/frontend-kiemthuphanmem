import axiosInstance from "./axiosInstance";

export const getNotificaton = async (id_user: string) => {
  const res = await axiosInstance.get(`/notification/${id_user}`);
  return res.data;
};
export const readAt = async (id_notification: string) => {
  const res = await axiosInstance.put(`/notification/read/${id_notification}`);
  return res.data;
};
