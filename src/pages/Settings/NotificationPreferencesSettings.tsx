import React, { useEffect, useState } from "react";
import {
  notificationPreferenceApi,
  NotificationPreference,
  UserActivityPattern,
} from "../../api/notificationPreferenceApi";
import toast from "react-hot-toast";
import { Loader2, Bell, Clock, Zap, Calendar, Activity, TrendingUp } from "lucide-react";

const palette = {
  card: "var(--surface-card)",
  muted: "var(--surface-muted)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  border: "var(--border-color)",
  accent: "var(--accent-color)",
  accentStrong: "var(--accent-color-strong)",
};

const cardStyle: React.CSSProperties = {
  background: palette.card,
  borderRadius: 0,
  padding: 24,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
  border: `1px solid ${palette.border}`,
  transition: "background 0.3s ease, color 0.3s ease, border-color 0.3s ease",
};

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const NotificationPreferencesSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [activityPattern, setActivityPattern] = useState<UserActivityPattern | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prefs, pattern] = await Promise.all([
        notificationPreferenceApi.getPreferences().catch(() => null),
        notificationPreferenceApi.getActivityPattern().catch(() => null),
      ]);
      
      // Ensure quiet_hours has default values
      if (prefs && !prefs.quiet_hours) {
        prefs.quiet_hours = {
          enabled: false,
          start_hour: 22,
          end_hour: 8,
        };
      }
      
      // Ensure other fields have defaults
      if (prefs) {
        prefs.smart_scheduling_enabled = prefs.smart_scheduling_enabled ?? true;
        prefs.urgent_types = Array.isArray(prefs.urgent_types) ? prefs.urgent_types : ['at_risk_task', 'task_overdue', 'system_alert'];
        prefs.min_delay_minutes = prefs.min_delay_minutes ?? 15;
        prefs.max_delay_minutes = prefs.max_delay_minutes ?? 120;
        prefs.active_days = Array.isArray(prefs.active_days) ? prefs.active_days : [1, 2, 3, 4, 5];
      }
      
      // Ensure activity pattern arrays have defaults
      if (pattern) {
        pattern.active_hours = Array.isArray(pattern.active_hours) ? pattern.active_hours : [];
        pattern.deep_work_periods = Array.isArray(pattern.deep_work_periods) ? pattern.deep_work_periods : [];
        pattern.optimal_notification_times = Array.isArray(pattern.optimal_notification_times) ? pattern.optimal_notification_times : [];
        pattern.metrics = pattern.metrics || {
          average_daily_active_hours: 0,
          most_active_day: 0,
          least_active_day: 0,
          average_session_duration: 0,
        };
      }
      
      setPreferences(prefs);
      setActivityPattern(pattern);
    } catch (error: any) {
      toast.error("Failed to load notification preferences");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;
    try {
      setSaving(true);
      await notificationPreferenceApi.updatePreferences(preferences);
      toast.success("Notification preferences saved successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setAnalyzing(true);
      const pattern = await notificationPreferenceApi.analyzeActivity(30);
      
      // Ensure arrays are initialized
      if (pattern) {
        pattern.active_hours = Array.isArray(pattern.active_hours) ? pattern.active_hours : [];
        pattern.deep_work_periods = Array.isArray(pattern.deep_work_periods) ? pattern.deep_work_periods : [];
        pattern.optimal_notification_times = Array.isArray(pattern.optimal_notification_times) ? pattern.optimal_notification_times : [];
        pattern.metrics = pattern.metrics || {
          average_daily_active_hours: 0,
          most_active_day: 0,
          least_active_day: 0,
          average_session_duration: 0,
        };
      }
      
      setActivityPattern(pattern);
      toast.success("Activity pattern analyzed successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to analyze activity");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: palette.accent }} />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div style={cardStyle}>
        <p style={{ color: palette.textSecondary }}>Failed to load preferences. Please try again.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Smart Scheduling Toggle */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Bell style={{ width: 20, height: 20, color: palette.accent }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: palette.textPrimary }}>
            Smart Notification Scheduling
          </h3>
        </div>
        <p style={{ fontSize: 14, color: palette.textSecondary, marginTop: 0, marginBottom: 16 }}>
          AI learns your activity patterns and schedules notifications at optimal times. Notifications are delayed
          during deep work periods and when you're offline.
        </p>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: palette.muted, borderRadius: 0, border: `1px solid ${palette.border}` }}>
          <div>
            <div style={{ fontWeight: 600, color: palette.textPrimary, marginBottom: 4 }}>
              Enable Smart Scheduling
            </div>
            <div style={{ fontSize: 13, color: palette.textSecondary }}>
              Automatically schedule notifications at optimal times
            </div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 48, height: 24 }} aria-label="Enable Smart Scheduling">
            <input
              type="checkbox"
              checked={preferences.smart_scheduling_enabled}
              onChange={(e) =>
                setPreferences({ ...preferences, smart_scheduling_enabled: e.target.checked })
              }
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: "absolute",
                cursor: "pointer",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: preferences.smart_scheduling_enabled ? palette.accent : "#ccc",
                borderRadius: 24,
                transition: "0.3s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  content: '""',
                  height: 18,
                  width: 18,
                  left: 3,
                  bottom: 3,
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "0.3s",
                  transform: preferences.smart_scheduling_enabled ? "translateX(24px)" : "translateX(0)",
                }}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Delay Settings */}
      {preferences.smart_scheduling_enabled && (
        <>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Clock style={{ width: 20, height: 20, color: palette.accent }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: palette.textPrimary }}>
                Delay Settings
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label htmlFor="min-delay" style={{ display: "block", fontSize: 14, fontWeight: 600, color: palette.textPrimary, marginBottom: 8 }}>
                  Minimum Delay (minutes)
                </label>
                <input
                  id="min-delay"
                  type="number"
                  min="0"
                  max="1440"
                  value={preferences.min_delay_minutes}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      min_delay_minutes: Number.parseInt(e.target.value) || 15,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 0,
                    fontSize: 14,
                    background: palette.card,
                    color: palette.textPrimary,
                  }}
                />
                <p style={{ fontSize: 12, color: palette.textSecondary, marginTop: 4 }}>
                  Minimum time before sending non-urgent notifications
                </p>
              </div>

              <div>
                <label htmlFor="max-delay" style={{ display: "block", fontSize: 14, fontWeight: 600, color: palette.textPrimary, marginBottom: 8 }}>
                  Maximum Delay (minutes)
                </label>
                <input
                  id="max-delay"
                  type="number"
                  min="0"
                  max="1440"
                  value={preferences.max_delay_minutes}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      max_delay_minutes: Number.parseInt(e.target.value) || 120,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 0,
                    fontSize: 14,
                    background: palette.card,
                    color: palette.textPrimary,
                  }}
                />
                <p style={{ fontSize: 12, color: palette.textSecondary, marginTop: 4 }}>
                  Maximum time to wait before sending notifications
                </p>
              </div>
            </div>
          </div>

          {/* Quiet Hours */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Calendar style={{ width: 20, height: 20, color: palette.accent }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: palette.textPrimary }}>
                Quiet Hours
              </h3>
            </div>

            <div style={{ padding: 16, background: palette.muted, borderRadius: 0, border: `1px solid ${palette.border}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 600, color: palette.textPrimary, marginBottom: 4 }}>
                    Enable Quiet Hours
                  </div>
                  <div style={{ fontSize: 13, color: palette.textSecondary }}>
                    Don't send notifications during these hours
                  </div>
                </div>
                <label style={{ position: "relative", display: "inline-block", width: 48, height: 24 }} aria-label="Enable Quiet Hours">
                  <input
                    type="checkbox"
                    checked={preferences.quiet_hours?.enabled ?? false}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        quiet_hours: { 
                          ...(preferences.quiet_hours || { enabled: false, start_hour: 22, end_hour: 8 }), 
                          enabled: e.target.checked 
                        },
                      })
                    }
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      cursor: "pointer",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: (preferences.quiet_hours?.enabled ?? false) ? palette.accent : "#ccc",
                      borderRadius: 24,
                      transition: "0.3s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        content: '""',
                        height: 18,
                        width: 18,
                        left: 3,
                        bottom: 3,
                        backgroundColor: "white",
                        borderRadius: "50%",
                        transition: "0.3s",
                        transform: (preferences.quiet_hours?.enabled ?? false) ? "translateX(24px)" : "translateX(0)",
                      }}
                    />
                  </span>
                </label>
              </div>

              {(preferences.quiet_hours?.enabled ?? false) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label htmlFor="quiet-start" style={{ display: "block", fontSize: 14, fontWeight: 600, color: palette.textPrimary, marginBottom: 8 }}>
                      Start Hour
                    </label>
                    <input
                      id="quiet-start"
                      type="number"
                      min="0"
                      max="23"
                      value={preferences.quiet_hours?.start_hour ?? 22}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          quiet_hours: {
                            ...(preferences.quiet_hours || { enabled: false, start_hour: 22, end_hour: 8 }),
                            start_hour: Number.parseInt(e.target.value) || 22,
                          },
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: `1px solid ${palette.border}`,
                        borderRadius: 0,
                        fontSize: 14,
                        background: palette.card,
                        color: palette.textPrimary,
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="quiet-end" style={{ display: "block", fontSize: 14, fontWeight: 600, color: palette.textPrimary, marginBottom: 8 }}>
                      End Hour
                    </label>
                    <input
                      id="quiet-end"
                      type="number"
                      min="0"
                      max="23"
                      value={preferences.quiet_hours?.end_hour ?? 8}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          quiet_hours: {
                            ...(preferences.quiet_hours || { enabled: false, start_hour: 22, end_hour: 8 }),
                            end_hour: Number.parseInt(e.target.value) || 8,
                          },
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: `1px solid ${palette.border}`,
                        borderRadius: 0,
                        fontSize: 14,
                        background: palette.card,
                        color: palette.textPrimary,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Urgent Types */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Zap style={{ width: 20, height: 20, color: palette.accent }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: palette.textPrimary }}>
                Urgent Notification Types
              </h3>
            </div>
            <p style={{ fontSize: 14, color: palette.textSecondary, marginTop: 0, marginBottom: 16 }}>
              These notification types will always be sent immediately, regardless of smart scheduling.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["at_risk_task", "task_overdue", "system_alert", "task_assigned", "comment_mention"].map((type) => (
                <label
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: (preferences.urgent_types || []).includes(type) ? palette.accent : palette.muted,
                    color: (preferences.urgent_types || []).includes(type) ? "white" : palette.textPrimary,
                    borderRadius: 0,
                    border: `1px solid ${palette.border}`,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(preferences.urgent_types || []).includes(type)}
                    onChange={(e) => {
                      const currentTypes = preferences.urgent_types || [];
                      if (e.target.checked) {
                        setPreferences({
                          ...preferences,
                          urgent_types: [...currentTypes, type],
                        });
                      } else {
                        setPreferences({
                          ...preferences,
                          urgent_types: currentTypes.filter((t) => t !== type),
                        });
                      }
                    }}
                    style={{ margin: 0 }}
                  />
                  {type.replaceAll("_", " ").replaceAll(/\b\w/g, (l) => l.toUpperCase())}
                </label>
              ))}
            </div>
          </div>

          {/* Activity Pattern Analysis */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Activity style={{ width: 20, height: 20, color: palette.accent }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: palette.textPrimary }}>
                  Activity Pattern Analysis
                </h3>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                style={{
                  padding: "8px 16px",
                  background: palette.accent,
                  color: "white",
                  border: "none",
                  borderRadius: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: analyzing ? "not-allowed" : "pointer",
                  opacity: analyzing ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Analyze Activity
                  </>
                )}
              </button>
            </div>

            {activityPattern ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ padding: 16, background: palette.muted, borderRadius: 0, border: `1px solid ${palette.border}` }}>
                  <div style={{ fontSize: 13, color: palette.textSecondary, marginBottom: 8 }}>
                    Confidence Score: <strong style={{ color: palette.textPrimary }}>{(activityPattern.confidence_score * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{ fontSize: 13, color: palette.textSecondary }}>
                    Last Analyzed: {new Date(activityPattern.last_analyzed_at).toLocaleString()}
                  </div>
                </div>

                {/* Active Hours */}
                {activityPattern.active_hours && activityPattern.active_hours.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: palette.textPrimary, marginBottom: 8 }}>
                      Active Hours
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {activityPattern.active_hours.map((hour) => (
                        <span
                          key={hour}
                          style={{
                            padding: "4px 12px",
                            background: palette.accent,
                            color: "white",
                            borderRadius: 0,
                            fontSize: 12,
                          }}
                        >
                          {hour}:00
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deep Work Periods */}
                {activityPattern.deep_work_periods && activityPattern.deep_work_periods.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: palette.textPrimary, marginBottom: 8 }}>
                      Deep Work Periods (Notifications Delayed)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {activityPattern.deep_work_periods.map((period) => (
                        <div
                          key={`${period.day_of_week}-${period.start_hour}-${period.end_hour}`}
                          style={{
                            padding: "12px",
                            background: palette.muted,
                            borderRadius: 0,
                            border: `1px solid ${palette.border}`,
                            fontSize: 13,
                          }}
                        >
                          <strong>{dayNames[period.day_of_week]}</strong>: {period.start_hour}:00 - {period.end_hour}:00
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimal Notification Times */}
                {activityPattern.optimal_notification_times && activityPattern.optimal_notification_times.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: palette.textPrimary, marginBottom: 8 }}>
                      Optimal Notification Times
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {activityPattern.optimal_notification_times.map((time) => (
                        <div
                          key={`${time.day_of_week}-${(time.hours || []).join("-")}`}
                          style={{
                            padding: "12px",
                            background: palette.muted,
                            borderRadius: 0,
                            border: `1px solid ${palette.border}`,
                            fontSize: 13,
                          }}
                        >
                          <strong>{dayNames[time.day_of_week]}</strong>:{" "}
                          {(time.hours || []).map((h) => `${h}:00`).join(", ")}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: palette.textSecondary }}>
                <p>No activity pattern data available. Click "Analyze Activity" to generate patterns.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 24px",
            background: palette.accent,
            color: "white",
            border: "none",
            borderRadius: 0,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferencesSettings;

