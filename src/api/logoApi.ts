import axiosInstance from "./axiosInstance";

export interface LogoItem {
  _id: string;
  url: string;
  description?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogoApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Legacy helper cho các chỗ cũ (Sidebar, SplashScreen, Login) – giữ nguyên contract:
// trả về { success, data: LogoItem[] }
export const getUlrLogo = async (): Promise<LogoApiResponse<LogoItem[]>> => {
  // dùng endpoint public /current, bọc lại thành mảng 1 phần tử
  const current = await getCurrentLogo();
  return {
    success: true,
    data: current ? [current] : [],
  };
};

// Lấy logo đang được sử dụng
export const getCurrentLogo = async (): Promise<LogoItem | null> => {
  const res = await axiosInstance.get<LogoApiResponse<LogoItem | null>>(
    "/logoUlr/current"
  );
  if (res.data.success) {
    return (res.data.data as LogoItem) ?? null;
  }
  throw new Error(res.data.message || "Không lấy được logo hiện tại");
};

// Lấy danh sách tất cả logo (admin)
export const getAllLogos = async (): Promise<LogoItem[]> => {
  const res = await axiosInstance.get<LogoApiResponse<LogoItem[]>>("/logoUlr");
  if (res.data.success && Array.isArray(res.data.data)) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Không lấy được danh sách logo");
};

// Tạo logo mới
export const createLogo = async (payload: {
  url: string;
  description?: string;
  is_active?: boolean;
}): Promise<LogoItem> => {
  const res = await axiosInstance.post<LogoApiResponse<LogoItem>>(
    "/logoUlr",
    payload
  );
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Không tạo được logo");
};

// Cập nhật logo
export const updateLogo = async (
  id: string,
  payload: Partial<Pick<LogoItem, "url" | "description" | "is_active">>
): Promise<LogoItem> => {
  const res = await axiosInstance.put<LogoApiResponse<LogoItem>>(
    `/logoUlr/${id}`,
    payload
  );
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Không cập nhật được logo");
};

// Đặt logo làm active
export const activateLogo = async (id: string): Promise<LogoItem> => {
  const res = await axiosInstance.post<LogoApiResponse<LogoItem>>(
    `/logoUlr/${id}/activate`
  );
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Không kích hoạt được logo");
};

// Xoá logo
export const deleteLogo = async (id: string): Promise<void> => {
  const res = await axiosInstance.delete<LogoApiResponse>(
    `/logoUlr/${id}`
  );
  if (!res.data.success) {
    throw new Error(res.data.message || "Không xoá được logo");
  }
};

// Upload file logo mới (FormData)
export const uploadLogoFile = async (formData: FormData): Promise<LogoItem> => {
  const res = await axiosInstance.post<LogoApiResponse<LogoItem>>(
    "/logoUlr/upload",
    formData
  );
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  throw new Error(res.data.message || "Không upload được logo");
};

