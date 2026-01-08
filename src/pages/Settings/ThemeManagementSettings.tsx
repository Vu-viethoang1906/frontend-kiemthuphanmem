import React, { useEffect, useState } from "react";
import {
  AppTheme,
  getStoredTheme,
  setTheme,
  getSystemTheme,
  watchSystemTheme,
} from "../../utils/theme";

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

const ThemeManagementSettings: React.FC = () => {
  const [theme, setThemeState] = useState<AppTheme>("system");
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme());

  useEffect(() => {
    setThemeState(getStoredTheme());
    
    // Watch system theme changes
    const unwatch = watchSystemTheme((newTheme) => {
      setSystemTheme(newTheme);
      // If current theme is "system", apply the new system theme
      if (getStoredTheme() === "system") {
        setTheme("system");
      }
    });
    
    return unwatch;
  }, []);

  const handleChangeTheme = (next: AppTheme) => {
    setThemeState(next);
    setTheme(next);
  };

  const effectiveTheme = theme === "system" ? systemTheme : theme;

  return (
    <div style={cardStyle}>
      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 8,
          color: palette.textPrimary,
        }}
      >
        Theme Management
      </h3>
      <p
        style={{
          fontSize: 14,
          color: palette.textSecondary,
          marginTop: 0,
        }}
      >
        Customize system interface (light/dark mode) for the entire application.
      </p>

      {/* Chọn Light / Dark */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 0,
          background: palette.muted,
          border: `1px solid ${palette.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: palette.textPrimary,
              }}
            >
              Display Mode
            </div>
            <p
              style={{
                fontSize: 12,
                color: palette.textSecondary,
                margin: 0,
                marginTop: 4,
              }}
            >
              Choose between light (Light), dark (Dark) interface or automatically follow system (System). 
              Settings will be saved to your browser.
              {theme === "system" && (
                <span style={{ display: "block", marginTop: 4, fontWeight: 600 }}>
                  Currently using: {systemTheme === "dark" ? "Dark" : "Light"} (system)
                </span>
              )}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              background: "rgba(99,102,241,0.08)",
              borderRadius: 0,
              padding: 2,
            }}
          >
            <button
              type="button"
              style={{
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: theme === "light" ? "#ffffff" : "transparent",
                color:
                  theme === "light" ? palette.textPrimary : palette.textSecondary,
                transition: "all 0.2s ease",
              }}
              onClick={() => handleChangeTheme("light")}
            >
              Light
            </button>
            <button
              type="button"
              style={{
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background:
                  theme === "dark"
                    ? "rgba(15,23,42,0.9)"
                    : "transparent",
                color:
                  theme === "dark" ? "#e5e7eb" : palette.textSecondary,
                transition: "all 0.2s ease",
              }}
              onClick={() => handleChangeTheme("dark")}
            >
              Dark
            </button>
            <button
              type="button"
              style={{
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background:
                  theme === "system" ? palette.accent : "transparent",
                color: theme === "system" ? "#ffffff" : palette.textSecondary,
                transition: "all 0.2s ease",
              }}
              onClick={() => handleChangeTheme("system")}
              title={`System (${systemTheme})`}
            >
              System
            </button>
          </div>
        </div>

        {/* Preview khung sáng/tối */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
            <div
              style={{
                borderRadius: 0,
                padding: 10,
                border:
                  effectiveTheme === "light"
                    ? `2px solid ${palette.accent}`
                    : `1px solid ${palette.border}`,
                background: palette.card,
                boxShadow:
                  effectiveTheme === "light"
                    ? "0 8px 16px rgba(15,23,42,0.08)"
                    : "0 2px 4px rgba(15,23,42,0.04)",
              }}
            >
            <div
              style={{
                width: 40,
                height: 6,
                borderRadius: 999,
                background: "#2563eb",
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 40,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg,#f1f5f9 0%,#e5e7eb 50%,#f9fafb 100%)",
              }}
            />
          </div>

            <div
              style={{
                borderRadius: 0,
                padding: 10,
                border:
                  effectiveTheme === "dark"
                    ? "2px solid #6366f1"
                    : "1px solid #1f2937",
                background:
                  "radial-gradient(circle at top,#1e293b 0%,#020617 60%,#020617 100%)",
                color: "#e5e7eb",
              }}
            >
            <div
              style={{
                width: 40,
                height: 6,
                borderRadius: 999,
                background: "#6366f1",
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 40,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg,#0f172a 0%,#1f2937 40%,#0b1120 100%)",
              }}
            />
          </div>
        </div>
      </div>

      <p
        style={{
          marginTop: 10,
          fontSize: 12,
        color: palette.textSecondary,
        }}
      >
        Tip: Dark interface is more suitable when working at night or in
        low-light environments.
      </p>
    </div>
  );
};

export default ThemeManagementSettings;


