import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getGamificationConfig,
  enableGamification,
  disableGamification,
  toggleGamification,
  updateGamificationPoints,
  GamificationConfig,
  UpdatePointsData,
} from "../../api/gamificationApi";

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 0,
  padding: 24,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e2e8f0",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const badgeStyle: React.CSSProperties = {
  borderRadius: 999,
  fontSize: 12,
  padding: "4px 10px",
  fontWeight: 600,
};

const toggleLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  cursor: "pointer",
  fontSize: 14,
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
  transition: "all 0.2s ease",
};

const GamificationSettings: React.FC = () => {
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [updatingPoints, setUpdatingPoints] = useState(false);

  // Form state cho points
  const [pointsPerTask, setPointsPerTask] = useState<number>(10);
  const [pointsDeduction, setPointsDeduction] = useState<number>(10);

  // Load config khi component mount
  useEffect(() => {
    loadConfig();
  }, []);

  // Cập nhật form khi config thay đổi
  useEffect(() => {
    if (config) {
      setPointsPerTask(config.points_per_task);
      setPointsDeduction(config.points_deduction);
    }
  }, [config]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await getGamificationConfig();
      if (response.success && response.data) {
        setConfig(response.data);
      }
    } catch (error: any) {
      console.error("Error loading gamification config:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to load gamification configuration"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    try {
      setToggling(true);
      const response = await toggleGamification();
      if (response.success) {
        setConfig(response.data);
        toast.success(
          <div>
            <div className="font-semibold mb-1">Gamification status updated!</div>
            <div className="text-sm text-gray-500">{response.message || "The gamification status has been updated."}</div>
          </div>
        );
      }
    } catch (error: any) {
      console.error("Error toggling gamification:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update gamification status"
      );
    } finally {
      setToggling(false);
    }
  };

  const handleEnable = async () => {
    try {
      setToggling(true);
      const response = await enableGamification();
      if (response.success) {
        setConfig(response.data);
        toast.success(
          <div>
            <div className="font-semibold mb-1">Gamification enabled!</div>
            <div className="text-sm text-gray-500">{response.message || "Gamification feature has been enabled."}</div>
          </div>
        );
      }
    } catch (error: any) {
      console.error("Error enabling gamification:", error);
      toast.error(
        error?.response?.data?.message || "Failed to enable gamification"
      );
    } finally {
      setToggling(false);
    }
  };

  const handleDisable = async () => {
    try {
      setToggling(true);
      const response = await disableGamification();
      if (response.success) {
        setConfig(response.data);
        toast.success(
          <div>
            <div className="font-semibold mb-1">Gamification disabled!</div>
            <div className="text-sm text-gray-500">{response.message || "Gamification feature has been disabled."}</div>
          </div>
        );
      }
    } catch (error: any) {
      console.error("Error disabling gamification:", error);
      toast.error(
        error?.response?.data?.message || "Failed to disable gamification"
      );
    } finally {
      setToggling(false);
    }
  };

  const handleUpdatePoints = async () => {
    if (pointsPerTask < 0 || pointsDeduction < 0) {
      toast.error("Points per task and deduction must be >= 0");
      return;
    }

    if (pointsPerTask === config?.points_per_task && pointsDeduction === config?.points_deduction) {
      toast.error("No changes to update");
      return;
    }

    try {
      setUpdatingPoints(true);
      const data: UpdatePointsData = {
        points_per_task: pointsPerTask,
        points_deduction: pointsDeduction,
      };
      const response = await updateGamificationPoints(data);
      if (response.success) {
        setConfig(response.data);
        toast.success(
          <div>
            <div className="font-semibold mb-1">Points updated successfully!</div>
            <div className="text-sm text-gray-500">{response.message || "The points configuration has been updated."}</div>
          </div>
        );
      }
    } catch (error: any) {
      console.error("Error updating points:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update points configuration"
      );
    } finally {
      setUpdatingPoints(false);
    }
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div
            style={{
              display: "inline-block",
              width: 40,
              height: 40,
              border: "4px solid #e5e7eb",
              borderTopColor: "#6366f1",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ marginTop: 16, color: "#64748b" }}>
            Loading configuration...
          </p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={cardStyle}>
        <p style={{ color: "#ef4444" }}>
          Failed to load gamification configuration. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h3 style={sectionTitleStyle}>
        🎮 Gamification Settings
      </h3>
      <p style={{ fontSize: 14, color: "#64748b", marginTop: 0, marginBottom: 24 }}>
        Manage gamification feature: enable/disable and configure reward points for users when completing tasks.
      </p>

      {/* Trạng thái bật/tắt */}
      <div
        style={{
          marginBottom: 24,
          padding: 20,
          borderRadius: 0,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
              Gamification Status
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                margin: 0,
              }}
            >
              {config.is_enabled
                ? "Feature is enabled. Users will receive points when completing tasks."
                : "Feature is disabled. Users will not receive points."}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                ...badgeStyle,
                background: config.is_enabled ? "#d1fae5" : "#fee2e2",
                color: config.is_enabled ? "#065f46" : "#991b1b",
              }}
            >
              {config.is_enabled ? "✓ Enabled" : "✗ Disabled"}
            </span>
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggling}
              style={{
                ...pillButtonBase,
                background: config.is_enabled ? "#ef4444" : "#10b981",
                color: "#ffffff",
                opacity: toggling ? 0.6 : 1,
                cursor: toggling ? "not-allowed" : "pointer",
              }}
            >
              {toggling ? (
                <>
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      border: "2px solid #ffffff",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                  Processing...
                </>
              ) : config.is_enabled ? (
                "Disable Gamification"
              ) : (
                "Enable Gamification"
              )}
            </button>
          </div>
        </div>

        {/* Buttons riêng biệt (optional) */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
          }}
        >
          <button
            type="button"
            onClick={handleEnable}
            disabled={toggling || config.is_enabled}
            style={{
              ...pillButtonBase,
              background: config.is_enabled ? "#d1fae5" : "#10b981",
              color: config.is_enabled ? "#065f46" : "#ffffff",
              opacity: config.is_enabled || toggling ? 0.5 : 1,
              cursor: config.is_enabled || toggling ? "not-allowed" : "pointer",
            }}
          >
            Enable
          </button>
          <button
            type="button"
            onClick={handleDisable}
            disabled={toggling || !config.is_enabled}
            style={{
              ...pillButtonBase,
              background: !config.is_enabled ? "#fee2e2" : "#ef4444",
              color: !config.is_enabled ? "#991b1b" : "#ffffff",
              opacity: !config.is_enabled || toggling ? 0.5 : 1,
              cursor: !config.is_enabled || toggling ? "not-allowed" : "pointer",
            }}
          >
            Disable
          </button>
        </div>
      </div>

      {/* Cấu hình điểm thưởng */}
      <div
        style={{
          marginBottom: 24,
          padding: 20,
          borderRadius: 0,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          Points Configuration
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#64748b",
            margin: 0,
            marginBottom: 20,
          }}
        >
          Adjust the number of points users receive when completing tasks or lose when tasks are moved out of Done status.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* Points per task */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Points per task
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={pointsPerTask}
              onChange={(e) => setPointsPerTask(parseInt(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid #d1d5db",
                borderRadius: 0,
                background: "#ffffff",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
              }}
            />
            <p
              style={{
                fontSize: 12,
                color: "#94a3b8",
                margin: "4px 0 0",
              }}
            >
              Points added when task is marked as Done
            </p>
          </div>

          {/* Points deduction */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Points deduction per task
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={pointsDeduction}
              onChange={(e) =>
                setPointsDeduction(parseInt(e.target.value) || 0)
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                border: "1px solid #d1d5db",
                borderRadius: 0,
                background: "#ffffff",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
              }}
            />
            <p
              style={{
                fontSize: 12,
                color: "#94a3b8",
                margin: "4px 0 0",
              }}
            >
              Points deducted when task is moved out of Done
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUpdatePoints}
          disabled={updatingPoints}
          style={{
            ...pillButtonBase,
            background: "#6366f1",
            color: "#ffffff",
            opacity: updatingPoints ? 0.6 : 1,
            cursor: updatingPoints ? "not-allowed" : "pointer",
          }}
        >
          {updatingPoints ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  border: "2px solid #ffffff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }}
              />
              Updating...
            </>
          ) : (
            "Update Points"
          )}
        </button>
      </div>

      {/* Thông tin bổ sung */}
      <div
        style={{
          padding: 16,
          borderRadius: 0,
          background: "#fef3c7",
          border: "1px solid #fbbf24",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#92400e" }}>
          💡 Note
        </div>
        <ul
          style={{
            fontSize: 12,
            color: "#78350f",
            margin: 0,
            paddingLeft: 20,
          }}
        >
          <li>Point changes only apply to tasks marked as Done after the update.</li>
          <li>When gamification is disabled, users will not receive or lose points for any tasks.</li>
          <li>Default: Gamification is enabled with 10 reward points and 10 deduction points.</li>
        </ul>
      </div>

      {/* CSS animation cho spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GamificationSettings;

