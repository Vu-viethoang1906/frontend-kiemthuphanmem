import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import GoogleCalendarSettings from "./GoogleCalendarSettings";
import LogoManagementSettings from "./LogoManagementSettings";
import ThemeManagementSettings from "./ThemeManagementSettings";
import SidebarManagementSettings from "./SidebarManagementSettings";
import ApiKeyManagement from "./ApiKeyManagement";
import GamificationSettings from "./GamificationSettings";
import NotificationPreferencesSettings from "./NotificationPreferencesSettings";

type SettingsTabKey = "google" | "logo" | "theme" | "sidebar" | "apikey" | "gamification" | "notifications";

const allTabs: { key: SettingsTabKey; label: string; requiresSystemManager?: boolean }[] = [
  { key: "google", label: "Google Calendar", requiresSystemManager: false },
  { key: "notifications", label: "Notification Preferences", requiresSystemManager: false },
  { key: "theme", label: "Theme Management", requiresSystemManager: false },
  { key: "apikey", label: "API Key Management", requiresSystemManager: true },
  { key: "gamification", label: "Gamification Settings", requiresSystemManager: true },
  { key: "logo", label: "Logo Management", requiresSystemManager: true },
  { key: "sidebar", label: "Sidebar Management", requiresSystemManager: true },
];

const palette = {
  pageBg: "var(--bg-body)",
  heroBg: "var(--settings-hero-bg)",
  heroColor: "var(--settings-hero-color)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  border: "var(--border-color)",
  tabActiveBg: "var(--tab-active-bg)",
  tabActiveColor: "var(--tab-active-color)",
  tabInactiveColor: "var(--tab-inactive-color)",
};

const Settings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTabKey>("google");

  // Check if user is System Manager
  const isSystemManager = useMemo(() => {
    const rolesRaw = localStorage.getItem("roles");
    let roles: string[] = [];
    try {
      roles = rolesRaw ? JSON.parse(rolesRaw) : [];
    } catch {
      roles = [];
    }
    return roles.includes("System_Manager");
  }, []);

  // Filter tabs based on role
  const tabs = useMemo(() => {
    return allTabs.filter((tab) => {
      // All users can see tabs that don't require System Manager
      if (!tab.requiresSystemManager) return true;
      // Only System Manager can see tabs that require System Manager
      return isSystemManager;
    });
  }, [isSystemManager]);

  // Read tab from query params (when redirect from callback)
  useEffect(() => {
    const tabParam = searchParams.get("tab") as SettingsTabKey;
    if (tabParam && tabs.some((t) => t.key === tabParam)) {
      setActiveTab(tabParam);
    } else if (tabs.length > 0 && !tabs.some((t) => t.key === activeTab)) {
      // If current activeTab is not in filtered tabs, switch to first available tab
      setActiveTab(tabs[0].key);
    }
  }, [searchParams, tabs, activeTab]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "google":
        return <GoogleCalendarSettings />;
      case "notifications":
        return <NotificationPreferencesSettings />;
      case "logo":
        return <LogoManagementSettings />;
      case "theme":
        return <ThemeManagementSettings />;
      case "sidebar":
        return <SidebarManagementSettings />;
      case "apikey":
        return <ApiKeyManagement />;
      case "gamification":
        return <GamificationSettings />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        background: palette.pageBg,
        minHeight: "100vh",
        padding: "0 16px 32px",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <div
        style={{
          background: palette.heroBg,
          borderRadius: 0,
          margin: "32px auto 0",
          padding: "24px",
          boxShadow: "none",
          color: palette.heroColor,
          maxWidth: "1400px",
          marginBottom: "16px",
          transition: "background 0.3s ease, color 0.3s ease",
        }}
      >
        <h2 style={{ fontWeight: 800, fontSize: 28, margin: 0 }}>Settings</h2>
        <p style={{ margin: "8px 0 0", fontSize: 16 }}>
          Application & workspace settings
        </p>
      </div>

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Tab bar giống kiểu trong ảnh: thanh ngang với các nút tab */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "0 4px",
            borderBottom: `1px solid ${palette.border}`,
            marginBottom: 16,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  borderRadius: 0,
                  padding: "6px 14px",
                  fontSize: 13,
                  border: "none",
                  cursor: "pointer",
                  background: isActive ? palette.tabActiveBg : "transparent",
                  color: isActive ? palette.tabActiveColor : palette.tabInactiveColor,
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive
                    ? "0 1px 2px rgba(79,70,229,0.25)"
                    : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Nội dung tab đang chọn */}
        <div>{renderActiveTab()}</div>
      </div>
    </div>
  );
};

export default Settings;
