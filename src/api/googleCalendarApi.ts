import { apiWithAuth } from "./authApi";

const api = () => apiWithAuth();

export interface GoogleCalendarStatus {
  isConnected: boolean;
  isSyncEnabled: boolean;
  lastSyncAt?: string;
  syncFilter?: {
    only_with_dates: boolean;
    include_completed: boolean;
    board_ids: string[];
  };
}

export interface GoogleCalendarSyncFilter {
  only_with_dates?: boolean;
  include_completed?: boolean;
  board_ids?: string[];
}

export const getGoogleCalendarAuthUrl = async (): Promise<string> => {
  const client = api();
  const res = await client.get("/calendar/auth/url");
  if (res.data?.success && res.data.data?.authUrl) {
    const authUrl = res.data.data.authUrl;

    // Debug: Log redirect_uri để kiểm tra
    try {
      const url = new URL(authUrl);
      const redirectUri = url.searchParams.get("redirect_uri");
    } catch (e) {
      console.warn("Không thể parse authUrl để debug:", e);
    }

    return authUrl;
  }

  // Kiểm tra nếu là lỗi về OAuth config
  const errorMessage = res.data?.message || "Không lấy được Google Auth URL";
  if (
    errorMessage.includes("OAuth") ||
    errorMessage.includes("chưa được cấu hình")
  ) {
    throw new Error(
      `${errorMessage}\n\n` +
        `💡 Hướng dẫn:\n` +
        `1. Kiểm tra backend .env có đầy đủ: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI\n` +
        `2. Restart backend server sau khi thêm biến môi trường\n` +
        `3. Kiểm tra console log của backend`
    );
  }

  throw new Error(errorMessage);
};

export const getGoogleCalendarStatus =
  async (): Promise<GoogleCalendarStatus> => {
    const client = api();
    const res = await client.get("/calendar/status");
    if (res.data?.success && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || "Không lấy được trạng thái calendar");
  };

export const enableGoogleCalendarSync = async (
  sync_filter: GoogleCalendarSyncFilter
) => {
  const client = api();
  const res = await client.post("/calendar/sync/enable", {
    sync_filter, // Đúng format theo hướng dẫn: { sync_filter: {...} }
  });
  if (!res.data?.success) {
    throw new Error(
      res.data?.message || "Không thể bật đồng bộ Google Calendar"
    );
  }
  return res.data;
};

export const disableGoogleCalendarSync = async () => {
  const client = api();
  const res = await client.post("/calendar/sync/disable");
  if (!res.data?.success) {
    throw new Error(
      res.data?.message || "Không thể tắt đồng bộ Google Calendar"
    );
  }
  return res.data;
};

export const syncAllTasksToCalendar = async () => {
  const client = api();
  const res = await client.post("/calendar/sync/all");
  if (!res.data?.success) {
    throw new Error(res.data?.message || "Không thể đồng bộ tất cả task");
  }
  return res.data;
};

export const unsyncAllTasksFromCalendar = async () => {
  const client = api();
  const res = await client.post("/calendar/unsync/all");
  if (!res.data?.success) {
    throw new Error(res.data?.message || "Không thể xóa các event đã sync");
  }
  return res.data;
};
