import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useModal } from "../../components/ModalProvider";
import {
  activateLogo,
  deleteLogo,
  getAllLogos,
  getCurrentLogo,
  LogoItem,
  uploadLogoFile,
} from "../../api/logoApi";

const palette = {
  card: "var(--surface-card)",
  muted: "var(--surface-muted)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  border: "var(--border-color)",
  mutedBorder: "var(--muted-border)",
  accent: "var(--accent-color)",
  accentStrong: "var(--accent-color-strong)",
  accentSoft: "var(--accent-soft)",
  successBadgeBg: "var(--success-badge-bg)",
  successBadgeColor: "var(--success-badge-color)",
  mutedBadgeBg: "var(--muted-badge-bg)",
  mutedBadgeColor: "var(--muted-badge-color)",
  inputBg: "var(--input-bg)",
  inputBorder: "var(--input-border)",
  inputText: "var(--input-text)",
};

const cardStyle: React.CSSProperties = {
  background: palette.card,
  borderRadius: 0,
  padding: 24,
  boxShadow: "0 2px 8px var(--shadow-color)",
  border: `1px solid ${palette.border}`,
  transition: "background 0.3s ease, border-color 0.3s ease, color 0.3s ease",
};

// Helper function to convert logo URL to full URL
const getLogoUrl = (url: string | undefined): string => {
  if (!url) return "";
  
  // If it's already a full URL, return as is
  if (url.startsWith("http")) {
    return url;
  }
  
  // Convert relative path to full URL
  const baseUrl = process.env.REACT_APP_SOCKET_URL 
    ? process.env.REACT_APP_SOCKET_URL.replace("/api", "")
    : "http://localhost:3005";
  
  // Handle both /api/uploads and /uploads paths
  if (url.startsWith("/api/uploads")) {
    return `${baseUrl}${url}`;
  } else if (url.startsWith("/uploads")) {
    return `${baseUrl}/api${url}`;
  } else {
    // Relative path, assume it needs /api/uploads prefix
    const cleanPath = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}/api/uploads${cleanPath}`;
  }
};

const LogoManagementSettings: React.FC = () => {
  const modal = useModal();
  const [currentLogo, setCurrentLogo] = useState<LogoItem | null>(null);
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [newLogoDescription, setNewLogoDescription] = useState("");
  const [newLogoActive, setNewLogoActive] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [current, all] = await Promise.all([
        getCurrentLogo(),
        getAllLogos(),
      ]);
      setCurrentLogo(current);
      setLogos(all);
      // Lưu logo hiện tại xuống localStorage để Sidebar/Login có thể dùng lại
      if (current?.url) {
        localStorage.setItem("app_logo_url", current.url);
      } else {
        localStorage.removeItem("app_logo_url");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load logo data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogoFile) {
      toast.error("Please select a logo image file");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("file", newLogoFile);
      if (newLogoDescription.trim()) {
        formData.append("description", newLogoDescription.trim());
      }
      formData.append("is_active", String(newLogoActive));

      await uploadLogoFile(formData);
      toast.success(
        <div>
          <div className="font-semibold mb-1">Logo uploaded successfully!</div>
          <div className="text-sm text-gray-500">The new logo has been uploaded.</div>
        </div>
      );
      setNewLogoFile(null);
      setNewLogoDescription("");
      setNewLogoActive(true);
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to create logo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateLogo(id);
      toast.success(
        <div>
          <div className="font-semibold mb-1">Logo activated!</div>
          <div className="text-sm text-gray-500">The logo has been set as the current logo.</div>
        </div>
      );
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to activate logo");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await modal.confirm({
      title: "Delete Logo",
      message: "Are you sure you want to delete this logo?\nThis action cannot be undone!",
      variant: "error"
    });
    
    if (!confirmed) return;

    try {
      await deleteLogo(id);
      toast.success(
        <div>
          <div className="font-semibold mb-1">Logo deleted successfully!</div>
          <div className="text-sm text-gray-500">The logo has been removed.</div>
        </div>
      );
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete logo");
    }
  };

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
        Logo Management
      </h3>
      <p
        style={{
          fontSize: 14,
          color: palette.textSecondary,
          marginTop: 0,
        }}
      >
        Manage application logo for consistent display across the entire system.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 0,
          background: palette.muted,
          border: `1px dashed ${palette.border}`,
          display: "flex",
          alignItems: "center",
          gap: 16,
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: palette.border,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {currentLogo?.url ? (
            <img
              src={getLogoUrl(currentLogo.url)}
              alt="App logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => {
                console.error("Failed to load logo:", currentLogo.url);
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span style={{ fontSize: 24 }}>🖼️</span>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div>
              <p style={{ fontSize: 13, color: palette.textSecondary, margin: 0 }}>
                Current logo being used in the system.
              </p>
              {currentLogo?.description && (
                <p
                  style={{
                    fontSize: 12,
                    color: palette.textSecondary,
                    marginTop: 4,
                    marginBottom: 0,
                  }}
                >
                  {currentLogo.description}
                </p>
              )}
            </div>

            {currentLogo && (
              <span
                style={{
                  borderRadius: 999,
                  background: palette.successBadgeBg,
                  color: palette.successBadgeColor,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "4px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form thêm logo mới */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 0,
          background: palette.card,
          border: `1px solid ${palette.border}`,
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 8,
              color: palette.textPrimary,
            }}
          >
            Add New Logo
          </div>
        <form
          onSubmit={handleCreateLogo}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="logo-file-input"
              style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}
            >
              File logo (PNG/JPG/SVG)
            </label>
            <input
              id="logo-file-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={(e) =>
                setNewLogoFile(e.target.files && e.target.files[0]
                  ? e.target.files[0]
                  : null)
              }
              style={{
                borderRadius: 0,
                border: `1px solid ${palette.inputBorder}`,
                padding: "6px 10px",
                fontSize: 13,
                backgroundColor: palette.inputBg,
                color: palette.inputText,
                transition: "background 0.3s ease, color 0.3s ease, border-color 0.3s ease",
              }}
            />
            {newLogoFile && (
              <span style={{ fontSize: 11, color: palette.textSecondary }}>
                Selected: {newLogoFile.name}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label
              htmlFor="logo-description-input"
              style={{ fontSize: 12, fontWeight: 600, color: palette.textPrimary }}
            >
              Description (optional)
            </label>
            <textarea
              id="logo-description-input"
              value={newLogoDescription}
              onChange={(e) => setNewLogoDescription(e.target.value)}
              rows={2}
              style={{
                borderRadius: 8,
                border: `1px solid ${palette.inputBorder}`,
                padding: "6px 10px",
                fontSize: 13,
                resize: "vertical",
                backgroundColor: palette.inputBg,
                color: palette.inputText,
                transition: "background 0.3s ease, color 0.3s ease, border-color 0.3s ease",
              }}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: palette.textPrimary,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={newLogoActive}
              onChange={(e) => setNewLogoActive(e.target.checked)}
            />
            Set as current logo after creation
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              alignSelf: "flex-start",
              marginTop: 4,
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              background: palette.accent,
              color: "#ffffff",
              transition: "background 0.3s ease",
            }}
          >
            {submitting ? "Saving..." : "Save New Logo"}
          </button>
        </form>
      </div>

      {/* Danh sách logo */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 0,
          background: palette.card,
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
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: palette.textPrimary,
            }}
          >
            Logo History
          </span>
          {loading && (
            <span style={{ fontSize: 12, color: palette.textSecondary }}>
              Loading...
            </span>
          )}
        </div>

        {logos.length === 0 ? (
          <p style={{ fontSize: 13, color: palette.textSecondary, margin: 0 }}>
            No logos have been configured yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {logos.map((logo) => {
              const isActive = logo.is_active || logo._id === currentLogo?._id;
              return (
                <div
                  key={logo._id}
                  style={{
                    padding: 10,
                    borderRadius: 0,
                    border: `1px solid ${palette.border}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: isActive ? palette.accentSoft : palette.card,
                    transition: "background 0.3s ease, border-color 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 0,
                      background: palette.muted,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {logo.url ? (
                      <img
                        src={getLogoUrl(logo.url)}
                        alt="logo option"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                        onError={(e) => {
                          console.error("Failed to load logo:", logo.url);
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 18 }}>🖼️</span>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: palette.textPrimary,
                          maxWidth: 280,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {logo.url}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            borderRadius: 999,
                            background: palette.successBadgeBg,
                            color: palette.successBadgeColor,
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 8px",
                          }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    {logo.description && (
                      <div
                        style={{
                          fontSize: 12,
                          color: palette.textSecondary,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {logo.description}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleActivate(logo._id)}
                        style={{
                          borderRadius: 999,
                          padding: "4px 10px",
                          fontSize: 12,
                          border: "none",
                          cursor: "pointer",
                          background: palette.accent,
                          color: "#ffffff",
                          transition: "background 0.3s ease",
                        }}
                      >
                        Set as Logo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(logo._id)}
                      style={{
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 12,
                        border: "1px solid rgba(239,68,68,0.35)",
                        cursor: "pointer",
                        background: "transparent",
                        color: "#f87171",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {loading && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: palette.textSecondary,
          }}
        >
          Syncing logo data...
        </div>
      )}
    </div>
  );
};

export default LogoManagementSettings;


