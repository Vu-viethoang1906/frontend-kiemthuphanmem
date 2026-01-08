import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getGoogleCalendarStatus } from "../../api/googleCalendarApi";

const GoogleCalendarCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  // Xác định base path (dashboard hoặc admin)
  const getBasePath = (): string => {
    const rolesRaw = localStorage.getItem("roles");
    let roles: string[] = [];
    try {
      roles = rolesRaw ? JSON.parse(rolesRaw) : [];
    } catch {
      roles = [];
    }
    const allowedAdminRoles = ["admin", "System_Manager"];
    const isAdmin = roles.some((role) => allowedAdminRoles.includes(role));
    return isAdmin ? "/admin" : "/dashboard";
  };

  const redirectToSettings = () => {
    const basePath = getBasePath();
    navigate(`${basePath}/settings?tab=google`, { replace: true });
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Kiểm tra query params từ backend redirect
        const connected = searchParams.get("connected");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          // Có lỗi từ backend hoặc Google
          setStatus("error");
          
          // Xử lý lỗi redirect_uri_mismatch đặc biệt
          if (error === "redirect_uri_mismatch" || errorDescription?.includes("redirect_uri_mismatch")) {
            const detailedMessage = 
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
            
            setMessage(detailedMessage);
            toast.error("Redirect URI mismatch error - See details on this page", {
              duration: 10000,
            });
          } else {
            setMessage(errorDescription || error || "An error occurred while connecting Google Calendar");
            toast.error(errorDescription || error || "Failed to connect Google Calendar");
          }
          
          setTimeout(() => {
            redirectToSettings();
          }, 5000);
          return;
        }

        if (connected === "true") {
          setStatus("success");
          setMessage("Google Calendar connected successfully!");
          toast.success(
            <div>
              <div className="font-semibold mb-1">Google Calendar connected successfully!</div>
              <div className="text-sm text-gray-500">Your Google Calendar has been connected.</div>
            </div>
          );

          try {
            const calendarStatus = await getGoogleCalendarStatus();
            if (calendarStatus.isConnected) {
              setTimeout(() => {
                redirectToSettings();
              }, 1500);
            } else {
              setTimeout(() => {
                redirectToSettings();
              }, 2000);
            }
          } catch (err) {
            console.error("Error checking status:", err);
            setTimeout(() => {
              redirectToSettings();
            }, 2000);
          }
        } else {
          try {
            const calendarStatus = await getGoogleCalendarStatus();
            if (calendarStatus.isConnected) {
              setStatus("success");
              setMessage("Google Calendar connected successfully!");
              toast.success(
                <div>
                  <div className="font-semibold mb-1">Google Calendar connected successfully!</div>
                  <div className="text-sm text-gray-500">Your Google Calendar has been connected.</div>
                </div>
              );
              setTimeout(() => {
                redirectToSettings();
              }, 1500);
            } else {
              setStatus("error");
              setMessage("Failed to connect Google Calendar");
              toast.error("Failed to connect Google Calendar");
              setTimeout(() => {
                redirectToSettings();
              }, 3000);
            }
          } catch (err: any) {
            setStatus("error");
            setMessage(err?.message || "Unable to check connection status");
            toast.error(err?.message || "Unable to check connection status");
            setTimeout(() => {
              redirectToSettings();
            }, 3000);
          }
        }
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.message || "An error occurred while processing callback");
        toast.error(error?.message || "An error occurred while processing callback");
        
        setTimeout(() => {
          redirectToSettings();
        }, 3000);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "48px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {status === "loading" && (
          <>
            <div
              style={{
                width: "64px",
                height: "64px",
                border: "4px solid #e2e8f0",
                borderTop: "4px solid #2563eb",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 24px",
              }}
            />
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600 }}>
              Processing...
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              Connecting to Google Calendar
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600, color: "#059669" }}>
              Success!
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              {message || "Google Calendar connected successfully"}
            </p>
            <p style={{ margin: "16px 0 0", color: "#94a3b8", fontSize: "12px" }}>
              Redirecting to settings page...
            </p>
            <button
              onClick={redirectToSettings}
              style={{
                marginTop: "20px",
                padding: "10px 24px",
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#059669";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#10b981";
              }}
            >
              Return to Settings
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 600, color: "#dc2626" }}>
              Failed
            </h2>
            <div
              style={{
                margin: "0 0 16px",
                padding: "12px",
                background: "#fef2f2",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#991b1b",
                textAlign: "left",
                whiteSpace: "pre-line",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {message || "Unable to connect Google Calendar"}
            </div>
            <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: "12px" }}>
              Redirecting to settings page...
            </p>
            <button
              onClick={redirectToSettings}
              style={{
                padding: "10px 24px",
                background: "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#dc2626";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#ef4444";
              }}
            >
              Return to Settings
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleCalendarCallback;
