import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  enableGoogleCalendarSync,
  disableGoogleCalendarSync,
  getGoogleCalendarAuthUrl,
  getGoogleCalendarStatus,
  syncAllTasksToCalendar,
  unsyncAllTasksFromCalendar,
  GoogleCalendarStatus,
  GoogleCalendarSyncFilter,
} from "../../api/googleCalendarApi";

const palette = {
  card: "var(--surface-card)",
  muted: "var(--surface-muted)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  border: "var(--border-color)",
  accent: "var(--accent-color)",
  accentStrong: "var(--accent-color-strong)",
  accentSoft: "var(--accent-soft)",
  successBadgeBg: "var(--success-badge-bg)",
  successBadgeColor: "var(--success-badge-color)",
  mutedBadgeBg: "var(--muted-badge-bg)",
  mutedBadgeColor: "var(--muted-badge-color)",
};

const cardStyle: React.CSSProperties = {
  background: palette.card,
  borderRadius: 0,
  padding: 24,
  boxShadow: "0 2px 8px var(--shadow-color)",
  border: `1px solid ${palette.border}`,
  transition: "background 0.3s ease, border-color 0.3s ease, color 0.3s ease",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: palette.textPrimary,
};

const badgeStyle: React.CSSProperties = {
  borderRadius: 999,
  fontSize: 12,
  padding: "4px 10px",
  fontWeight: 600,
  color: palette.textPrimary,
};

const toggleLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  fontSize: 14,
  color: palette.textPrimary,
};

const pillButtonBase: React.CSSProperties = {
  borderRadius: 999,
  padding: "8px 16px",
  fontSize: 14,
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  transition: "background 0.3s ease, color 0.3s ease, opacity 0.3s ease",
};

const GoogleCalendarSettings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [unsyncing, setUnsyncing] = useState(false);
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [syncFilter, setSyncFilter] = useState<GoogleCalendarSyncFilter>({
    only_with_dates: true,
    include_completed: false,
    board_ids: [],
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await getGoogleCalendarStatus();
      setStatus(data);
      setSyncFilter(data.syncFilter || syncFilter);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load Google Calendar status");
    } finally {
      setLoading(false);
    }
  };

  // Load status khi component mount
  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Xử lý callback từ Google Calendar OAuth
  useEffect(() => {
    const handleCallback = async () => {
      const connected = searchParams.get("connected");
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      const syncEnabled = searchParams.get("syncEnabled");
      if (connected || error) {
        if (connected === "true") {
          console.log("🔄 Nhận callback: connected=true, đang refresh status...");
          await new Promise((resolve) => setTimeout(resolve, 500));
          try {
            setLoading(true);
            const data = await getGoogleCalendarStatus();
            console.log("✅ Status sau callback:", data);
            setStatus(data);
            if (data.syncFilter) {
              setSyncFilter(data.syncFilter);
            }
            
            toast.success(
              <div>
                <div className="font-semibold mb-1">Google Calendar connected successfully!</div>
                <div className="text-sm text-gray-500">Your Google Calendar has been connected.</div>
              </div>,
              { duration: 4000 }
            );
          } catch (err: any) {
            console.error("Error refreshing status:", err);
            toast.error(err?.message || "Failed to load status after connection");
          } finally {
            setLoading(false);
          }
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("connected");
          newSearchParams.delete("syncEnabled");
          if (newSearchParams.toString() === "") {
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            setSearchParams(newSearchParams, { replace: true });
          }
        } else if (error) {
          const errorMsg = errorDescription
            ? decodeURIComponent(errorDescription)
            : error === "redirect_uri_mismatch"
            ? "Redirect URI does not match Google Cloud Console. Please check configuration."
            : decodeURIComponent(error);

          toast.error(`Google Calendar connection error: ${errorMsg}`, {
            duration: 6000,
          });
          await fetchStatus();
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("error");
          newSearchParams.delete("error_description")
          if (newSearchParams.toString() === "") {
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            setSearchParams(newSearchParams, { replace: true });
          }
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const authUrl = await getGoogleCalendarAuthUrl();
      if (!authUrl) {
        throw new Error("No authentication URL received from server");
      }
      console.log("Google Auth URL:", authUrl);

      window.location.href = authUrl;
    } catch (error: any) {
      setConnecting(false);
      let errorMessage = error?.response?.data?.message || error?.message || "Failed to open Google Calendar connection page";
      if (errorMessage.includes('redirect_uri_mismatch') || errorMessage.includes('redirect_uri')) {
        errorMessage = 
          "Redirect URI mismatch error\n\n" +
          "Redirect URI does not match Google Cloud Console.\n\n" +
          "How to fix:\n" +
          "1. Check GOOGLE_REDIRECT_URI in backend .env\n" +
          "2. Add redirect URI to Google Cloud Console:\n" +
          "   - Go to: https://console.cloud.google.com/\n" +
          "   - APIs & Services → Credentials\n" +
          "   - Edit OAuth 2.0 Client ID\n" +
          "   - Add redirect URI (e.g., http://localhost:3005/api/calendar/auth/callback)\n" +
          "3. Ensure redirect URI matches 100% (no trailing slash, correct http/https, correct port)\n" +
          "4. Save and wait a few minutes for Google to update\n" +
          "5. Restart backend server";
      }
      
      toast.error(errorMessage, {
        duration: 8000,
      });
      console.error("❌ Lỗi khi lấy Google Auth URL:", error);
      console.error("📋 Error details:", {
        message: errorMessage,
        response: error?.response?.data,
        status: error?.response?.status,
      });
    }
  };

  const handleToggleSync = async () => {
    if (!status?.isConnected) {
      toast.error("You need to connect Google Calendar first");
      return;
    }

    try {
      setLoading(true);
      if (status.isSyncEnabled) {
        await disableGoogleCalendarSync();
        toast.success(
          <div>
            <div className="font-semibold mb-1">Google Calendar sync disabled!</div>
            <div className="text-sm text-gray-500">Sync has been turned off.</div>
          </div>
        );
      } else {
        await enableGoogleCalendarSync(syncFilter);
        toast.success(
          <div>
            <div className="font-semibold mb-1">Google Calendar sync enabled!</div>
            <div className="text-sm text-gray-500">Sync has been turned on.</div>
          </div>
        );
      }
      await fetchStatus();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update sync status");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeFilter = (field: keyof GoogleCalendarSyncFilter) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked;
      const next = {
        ...syncFilter,
        [field]: value,
      };
      setSyncFilter(next);
    };
  };

  const handleSaveFilter = async () => {
    if (!status?.isConnected) {
      toast.error("You need to connect Google Calendar first");
      return;
    }

    try {
      setLoading(true);
      await enableGoogleCalendarSync(syncFilter);
      toast.success(
        <div>
          <div className="font-semibold mb-1">Sync filter saved!</div>
          <div className="text-sm text-gray-500">The sync filter has been saved.</div>
        </div>
      );
      await fetchStatus();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save filter");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (!status?.isConnected || !status.isSyncEnabled) {
      toast.error("Please enable sync before syncing all tasks");
      return;
    }
    try {
      setSyncing(true);
      const res = await syncAllTasksToCalendar();
      const msg =
        res?.message ||
        `Sync completed: ${res?.data?.successCount || 0} successful, ${res?.data?.skippedCount || 0} skipped, ${res?.data?.errorCount || 0} errors`;
      toast.success(
        <div>
          <div className="font-semibold mb-1">Sync completed!</div>
          <div className="text-sm text-gray-500">{msg}</div>
        </div>
      );
      await fetchStatus();
    } catch (error: any) {
      toast.error(error?.message || "Failed to sync all tasks");
    } finally {
      setSyncing(false);
    }
  };

  const handleUnsyncAll = async () => {
    if (!status?.isConnected || !status.isSyncEnabled) {
      toast.error("Please enable sync before deleting events");
      return;
    }
    try {
      setUnsyncing(true);
      const res = await unsyncAllTasksFromCalendar();
      const msg =
        res?.message ||
        `Deleted ${res?.data?.deletedCount || 0} events, ${res?.data?.errorCount || 0} errors`;
      toast.success(
        <div>
          <div className="font-semibold mb-1">Events deleted!</div>
          <div className="text-sm text-gray-500">{msg}</div>
        </div>
      );
      await fetchStatus();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete events");
    } finally {
      setUnsyncing(false);
    }
  };

  const isConnected = status?.isConnected ?? false;
  const isSyncEnabled = status?.isSyncEnabled ?? false;

  // Debug: Log status changes
  useEffect(() => {
    console.log("📊 Google Calendar Status updated:", {
      isConnected,
      isSyncEnabled,
      status,
    });
  }, [status, isConnected, isSyncEnabled]);

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={sectionTitleStyle}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 0,
                background: palette.accentSoft,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              
            </span>
            <span>Google Calendar</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: palette.textSecondary }}>
            Connect your personal calendar to automatically create events for assigned tasks.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <span
              style={{
                ...badgeStyle,
                background: isConnected ? palette.successBadgeBg : palette.mutedBadgeBg,
                color: isConnected ? palette.successBadgeColor : palette.mutedBadgeColor,
              }}
            >
              {isConnected ? "Connected" : "Not Connected"}
            </span>
            <span
              style={{
                ...badgeStyle,
                background: isSyncEnabled
                  ? palette.accentSoft
                  : palette.mutedBadgeBg,
                color: isSyncEnabled ? palette.accent : palette.mutedBadgeColor,
              }}
            >
              {isSyncEnabled ? "Sync Enabled" : "Sync Disabled"}
            </span>
          </div>
          {status?.lastSyncAt && (
            <span style={{ fontSize: 12, color: palette.textSecondary }}>
              Last sync:{" "}
              {new Date(status.lastSyncAt).toLocaleString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
          gap: 24,
          alignItems: "flex-start",
        }}
      >
        {/* Cột trái: Connect & Sync */}
        <div
          style={{
            padding: 16,
            borderRadius: 0,
            background: palette.muted,
            border: `1px dashed ${palette.border}`,
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              type="button"
              style={{
                ...pillButtonBase,
                background: isConnected ? palette.muted : "linear-gradient(90deg,#22c55e,#16a34a)",
                color: isConnected ? palette.textPrimary : "#ffffff",
              }}
              onClick={handleConnect}
              disabled={connecting || loading}
            >
              {connecting
                ? "Opening Google..."
                : isConnected
                ? "Reconnect Google"
                : "Connect Google Calendar"}
            </button>

            <label style={toggleLabelStyle}>
              <input
                type="checkbox"
                checked={!!isSyncEnabled}
                onChange={handleToggleSync}
                disabled={loading || !isConnected}
              />
              <span>
                Enable automatic sync of new/updated tasks to Google Calendar
                {!isConnected && (
                  <span style={{ marginLeft: 4, color: "#ef4444", fontSize: 12 }}>
                    (connection required)
                  </span>
                )}
              </span>
            </label>

            <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <button
                type="button"
                style={{
                  ...pillButtonBase,
                  background: palette.accent,
                  color: "#ffffff",
                }}
                onClick={handleSyncAll}
                disabled={syncing || !isConnected || !isSyncEnabled}
              >
                {syncing ? "Syncing all..." : "Sync all assigned tasks"}
              </button>

              <button
                type="button"
                style={{
                  ...pillButtonBase,
                  background: "rgba(248,113,113,0.15)",
                  color: "#f87171",
                }}
                onClick={handleUnsyncAll}
                disabled={unsyncing || !isConnected || !isSyncEnabled}
              >
                {unsyncing ? "Deleting events..." : "Delete all synced events"}
              </button>
            </div>

            <p style={{ fontSize: 12, color: palette.textSecondary, margin: 0 }}>
              Note: Only tasks assigned to you will be synced to Google Calendar.
            </p>
          </div>
        </div>

        {/* Cột phải: Bộ lọc sync */}
        <div
          style={{
            padding: 16,
            borderRadius: 0,
            background: palette.muted,
            border: `1px solid ${palette.border}`,
            transition: "background 0.3s ease, border-color 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: palette.textPrimary }}>
              Sync Filter
            </span>
            <button
              type="button"
              style={{
                ...pillButtonBase,
                background: palette.accentStrong,
                color: "#f9fafb",
              }}
              onClick={handleSaveFilter}
              disabled={loading || !isConnected}
            >
              Save Filter
            </button>
          </div>

          <p style={{ fontSize: 12, color: palette.textSecondary, marginTop: 0, marginBottom: 12 }}>
            Fine-tune conditions to prevent calendar overload from unnecessary tasks.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={toggleLabelStyle}>
              <input
                type="checkbox"
                checked={!!syncFilter.only_with_dates}
                onChange={handleChangeFilter("only_with_dates")}
              />
              <span>
                Only sync tasks with start date or deadline
                <span style={{ display: "block", fontSize: 12, color: palette.textSecondary }}>
                  Tasks without dates will not be added to Google Calendar.
                </span>
              </span>
            </label>

            <label style={toggleLabelStyle}>
              <input
                type="checkbox"
                checked={!!syncFilter.include_completed}
                onChange={handleChangeFilter("include_completed")}
              />
              <span>
                Include completed tasks
                <span style={{ display: "block", fontSize: 12, color: palette.textSecondary }}>
                  If disabled, tasks in Done column will not be synced.
                </span>
              </span>
            </label>

            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Limit by board (optional)
              </div>
              <p style={{ fontSize: 12, color: palette.textSecondary, marginTop: 0 }}>
                Currently all boards you participate in are synced. If you need to limit to specific boards,
                please contact admin for additional configuration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: palette.textSecondary,
          }}
        >
          Loading Google Calendar data...
        </div>
      )}
    </div>
  );
};

export default GoogleCalendarSettings;
