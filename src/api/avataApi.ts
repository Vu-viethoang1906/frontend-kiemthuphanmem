import axiosInstance from "./axiosInstance";

export const fetchAvatarUser = async (id: string) => {
  const res = await axiosInstance.get(`img/users/${id}/avatar`);
  // Trả về URL đầy đủ (dễ dùng trong <img>)
  const baseUrl = process.env.REACT_APP_SOCKET_URL || "http://localhost:3005";
  return {
    avatar_url: `${baseUrl}${res.data.avatar_url}`,
  };
};

// ✅ Gửi file avatar lên
export const updateAvatar = async (id: string, file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await axiosInstance.post(`img/users/${id}/avatar`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
