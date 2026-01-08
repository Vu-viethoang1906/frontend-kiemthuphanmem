import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type UserMenuProps = {
  avatarUrl: string;
  email: string;
  displayName?: string;
  onLogout: () => void;
  accent?: "gray" | "red";
};

// Helper function to get initials from name
const getInitials = (name?: string, email?: string): string => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0]?.toUpperCase() || "U";
  }
  if (email) {
    return email[0]?.toUpperCase() || "U";
  }
  return "U";
};

// Helper function to get avatar color from name
const getAvatarColor = (name: string): string => {
  const colors = [
    '#6366F1', // indigo-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#3B82F6', // blue-500
    '#14B8A6', // cyan-500
    '#F97316', // orange-500
    '#6B7280', // gray-500
    '#9CA3AF', // gray-400
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const accentBorder: Record<NonNullable<UserMenuProps["accent"]>, string> = {
  gray: "border-gray-200",
  red: "border-red-500",
};

const UserMenu: React.FC<UserMenuProps> = ({
  avatarUrl,
  email,
  displayName,
  onLogout,
  accent = "gray",
}) => {
  const [open, setOpen] = React.useState(false);
  const [isDarkPreview, setIsDarkPreview] = React.useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  
  // Reset avatar error when avatarUrl changes
  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);
  
  // Check if avatarUrl is valid (not default placeholder)
  const hasValidAvatar = avatarUrl && 
    !avatarUrl.includes('/icons/avatar1.jpg') && 
    !avatarUrl.includes('/icons/g2.jpg') &&
    avatarUrl !== '/icons/avatar1.jpg' &&
    avatarUrl !== '/icons/g2.jpg' &&
    !avatarError;
  
  const initials = getInitials(displayName, email);
  const avatarColor = getAvatarColor(displayName || email || 'User');

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", clickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", clickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 hover:opacity-90 transition"
      >
        {hasValidAvatar ? (
          <img
            src={avatarUrl}
            alt="User avatar"
            className={`w-8 h-8 rounded-full object-cover border-2 ${accentBorder[accent]}`}
            onError={() => setAvatarError(true)}
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 ${accentBorder[accent]}`}
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-w-[90vw] z-50">
          <div className="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between p-4">
              <div className="min-w-0">
                <p className="text-sm text-gray-500 truncate">{email}</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
            <div className="px-6 pb-4 -mt-2">
              <div className="flex flex-col items-center text-center">
                {hasValidAvatar ? (
                  <img 
                    src={avatarUrl} 
                    alt="Large avatar" 
                    className="w-16 h-16 rounded-full object-cover shadow-sm"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initials}
                  </div>
                )}
                <div className="mt-3">
                  <p className="text-base font-semibold text-gray-900">
                    {displayName || email.split("@")[0].toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/dashboard/profile");
                  }}
                  className="no-underline mt-3 inline-flex items-center px-4 py-2 rounded-full border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors"
                >
                  Manage account
                </button>
              </div>
            </div>

            <div className="px-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Appearance</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDarkPreview}
                    onClick={() => setIsDarkPreview(v => !v)}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${isDarkPreview ? "bg-gray-900" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isDarkPreview ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-gray-500">{isDarkPreview ? "Dark" : "Light"}</div>
              </div>
            </div>

              <div className="px-2 mt-3">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-start gap-2 px-4 py-3 hover:bg-gray-100 rounded-lg text-sm text-gray-700"
                aria-label="Log out"
                title="Log out"
              >
                <img src="/icons/logout.png" alt="Logout" className="h-5" />
                <span>Log out</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 px-4 py-3">
              <button type="button" className="hover:underline">Privacy Policy</button>
              <span>•</span>
              <button type="button" className="hover:underline">Terms of Service</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;