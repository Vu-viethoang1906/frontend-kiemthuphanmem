import React, { useState, useEffect } from "react";
import { updateProfile ,changePassword } from "../../api/updateProfile";
import { getUserProfile, getMe } from "../../api/authApi";
import toast from "react-hot-toast";
import { fetchAvatarUser,updateAvatar } from "../../api/avataApi";
import { uploadLimits, formatBytes } from "../../config/uploadLimits";
import { getUserPointsByUser, UserPoint } from "../../api/userPointApi";
import { trackBehavior } from "../../api/adaptiveGamificationApi";

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

// Component for avatar with fallback to initials
const AvatarWithFallback: React.FC<{
  src: string;
  alt: string;
  fallbackInitials: string;
  fallbackColor: string;
  size?: "small" | "large";
}> = ({ src, alt, fallbackInitials, fallbackColor, size = "large" }) => {
  const [imgError, setImgError] = useState(false);
  const textSize = size === "large" ? "text-2xl" : "text-xs";
  
  if (imgError) {
    return (
      <span
        className={`text-white font-bold ${textSize} w-full h-full flex items-center justify-center`}
        style={{ backgroundColor: fallbackColor }}
      >
        {fallbackInitials}
      </span>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      onError={() => setImgError(true)}
    />
  );
};
const UserProfilePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState("Profile");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ full_name: "", username: "", email: "" });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarTimestamp, setAvatarTimestamp] = useState<number>(Date.now());
  const [userPoints, setUserPoints] = useState<UserPoint[]>([]);
  const [myCenters, setMyCenters] = useState<any[]>([]);
  const avatarChoices = [
    "/icons/avatar1.jpg",
    "/icons/g1.jpg",
    "/icons/g2.jpg",
    "/icons/g3.jpg",
    "/icons/g4.jpg",
    "/icons/g5.jpg",
    "/icons/logo192.png",
    "/icons/logo512.png",
    "/icons/logo1.jpg",
    "/icons/logo2.jpg",
  ];
  // Center edit state
  const [editingCenter, setEditingCenter] = useState(false);
  const [centerForm, setCenterForm] = useState({ where: "" });

  useEffect(() => {
    if (activeTab !== "Profile" && activeTab !== "Points" && activeTab !== "Center") return;
    setLoading(true);
    const fetchUser = async () => {
      try {
        // Lấy id hiện tại từ BE để tránh phụ thuộc localStorage
        const me = await getMe();
        const userId = me?.success && me.data?._id
          ? me.data._id
          : localStorage.getItem("userId");

        if (!userId) {
          setUser(null);
          return;
        }
       
        // Fetch user profile (chỉ khi ở tab Profile)
        if (activeTab === "Profile") {
          const res = await getUserProfile(userId);
    
          const avatarData = await fetchAvatarUser(userId);
          
          // Load location từ localStorage
          const savedLocation = localStorage.getItem(`user_location_${userId}`) || "";
          
          setUser({ ...res, avatar_url: avatarData?.avatar_url || "/icons/avatar1.jpg", location: savedLocation });
         
          setForm({
            full_name: res.full_name || "",
            username: res.username || "",
            email: res.email || ""
          });
          
          // Lưu location vào centerForm để dùng cho tab Center
          setCenterForm({
            where: savedLocation
          });
        }

        // Fetch user points (khi ở tab Points)
        if (activeTab === "Points") {
          try {
            const pointsData = await getUserPointsByUser(userId);
            setUserPoints(pointsData || []);
            
            // Track behavior: user views points
            if (pointsData && pointsData.length > 0) {
              const firstCenterId = pointsData[0].center_id?._id || pointsData[0].center_id;
              if (firstCenterId) {
                trackBehavior(firstCenterId, "view_points", "points", {
                  points_value: pointsData[0].points || 0,
                }).catch(console.error);
              }
            }
          } catch (pointsErr: any) {
            console.warn("⚠️ Không lấy được points:", pointsErr);
            
            // 🔥 Check permission errors
            if (pointsErr?.response?.status === 403) {
              toast.error("You do not have permission to view points");
            } else if (pointsErr?.response?.status === 401) {
              toast.error("Session expired");
            }
            
            setUserPoints([]);
          }
}

        // Fetch user centers (khi ở tab Center)
        if (activeTab === "Center") {
          try {
            // Lấy thông tin user từ getUserProfile - đã bao gồm centers array
            const profileData = await getUserProfile(userId);
            
            // Load location từ localStorage
            const savedLocation = localStorage.getItem(`user_location_${userId}`) || "";
            
            // profileData chứa user info và centers array
            setUser({ ...profileData, location: savedLocation });
            setCenterForm({
              where: savedLocation
            });

            // Lấy centers từ profileData.centers (đã được backend populate)
            const centersArray = profileData.centers || [];
            
            setMyCenters(centersArray);
          } catch (centersErr: any) {
            console.warn("⚠️ Không lấy được centers:", centersErr);
            
            // 🔥 Check permission errors
            if (centersErr?.response?.status === 403) {
              toast.error("You do not have permission to view centers");
            } else if (centersErr?.response?.status === 401) {
              toast.error("Session expired");
            }
            
            setMyCenters([]);
          }
        }
        
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [activeTab]);

  return (
    <div className="w-full px-4 sm:px-6 py-6 bg-gray-50 min-h-screen font-serif">
      <div className="mb-6">
        <div className="rounded-none overflow-hidden shadow-md border border-blue-200/70">
          <div className="bg-gradient-to-r from-blue-500/90 to-blue-600/90 px-6 py-6">
            <div className="text-3xl md:text-4xl font-bold text-white tracking-tight">Settings</div>
            <div className="mt-1.5 text-base md:text-lg text-white/90">Manage your account settings and preferences</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-blue-200 rounded-none p-2 mb-6 shadow-sm flex gap-2">
        {["Profile", "Account", "Center", "Points"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${
              activeTab === tab
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-blue-200 hover:bg-blue-50"
            } px-4 py-2 rounded-md text-sm font-medium transition-all`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <div className="bg-white border border-blue-200 rounded-none shadow-md">
          <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between">
            <div>
              <div className="text-xl md:text-2xl font-semibold leading-tight text-slate-900">Profile Information</div>
              <div className="mt-0.5 text-sm md:text-base leading-relaxed text-slate-600">Update your personal information and profile settings</div>
            </div>
            <div className="flex items-center gap-2">
              {editMode ? (
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    onClick={async () => {
  try {
    setLoading(true);
    await updateProfile(user._id, {
      full_name: form.full_name,
      username: form.username,
      email: form.email,
    });
    setUser({ ...user, ...form });
    setEditMode(false);
    toast.success(
      <div>
        <div className="font-semibold mb-1">Profile updated successfully!</div>
        <div className="text-sm text-gray-500">Your information has been updated.</div>
      </div>
    );
  } catch (e: any) {
    // 🔥 Check permission errors
    if (e?.response?.status === 403) {
      toast.error("You do not have permission to update profile");
    } else if (e?.response?.status === 401) {
      toast.error("Session expired");
    } else {
      toast.error(e?.response?.data?.message || "Failed to update profile");
    }
  } finally {
    setLoading(false);
  }
}}

                  >
                    Save
                  </button>
                  <button
                    className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    onClick={() => {
                      setForm({
                        full_name: user.full_name || "",
                        username: user.username || "",
                        email: user.email || "",
                      });
                      setEditMode(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" onClick={() => setEditMode(true)}>
                  Edit
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-5 text-sm text-slate-600">Loading...</div>
          ) : user ? (
            <>
              <div className="flex items-start gap-4 mx-6 mt-1 mb-3 py-2">
                <div className="h-24 w-24 rounded-full overflow-hidden ring-2 ring-blue-300 flex items-center justify-center">
                  {user.avatar_url && !user.avatar_url.startsWith("/icons/") ? (
                    <AvatarWithFallback
                      src={`${user.avatar_url}?t=${avatarTimestamp}`}
                      alt="avatar"
                      fallbackInitials={getInitials(user.full_name, user.email)}
                      fallbackColor={getAvatarColor(user.full_name || user.email || 'User')}
                      size="large"
                    />
                  ) : (
                    <span
                      className="text-white font-bold text-2xl w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: getAvatarColor(user.full_name || user.email || 'User') }}
                    >
                      {getInitials(user.full_name, user.email)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col justify-between h-24 py-1 ml-2 sm:ml-3">
  {/* Input ẩn để chọn ảnh */}
  <input
    type="file"
    accept="image/*"
    id="avatarInput"
    className="hidden"
    onChange={async (e) => {
  const file = e.target.files?.[0];
  if (!file || !user?._id) return;

  if (file.size > uploadLimits.avatarMaxBytes) {
    toast.error(`File exceeds the maximum size of ${formatBytes(uploadLimits.avatarMaxBytes)}.`);
    return;
  }

  try {
    setLoading(true);

    // Gọi API cập nhật avatar
    await updateAvatar(user._id, file);

    // ✅ Fetch lại avatar từ server để lấy URL chính xác
    const avatarData = await fetchAvatarUser(user._id);
    const newAvatarUrl = avatarData?.avatar_url || "/icons/avatar1.jpg";

    // Cập nhật timestamp để force reload ảnh
    const newTimestamp = Date.now();
    setAvatarTimestamp(newTimestamp);

    // Cập nhật ngay giao diện hiện tại
    setUser({ ...user, avatar_url: newAvatarUrl });

    toast.success(
      <div>
        <div className="font-semibold mb-1">Avatar updated!</div>
        <div className="text-sm text-gray-500">Your avatar has been changed.</div>
      </div>
    );

    // ✅ Gửi sự kiện toàn cục để Dashboard tự đổi avatar
    window.dispatchEvent(
      new CustomEvent("avatar-updated", {
        detail: { avatar_url: newAvatarUrl },
      })
    );

  } catch (err: any) {
    console.error("❌ Upload error:", err);
    console.error("❌ Error response:", err.response?.data);
    
    // 🔥 Check permission errors
    if (err?.response?.status === 403) {
      toast.error("You do not have permission to update avatar");
    } else if (err?.response?.status === 401) {
      toast.error("Session expired");
    } else {
      toast.error(err?.response?.data?.message || "Unable to update avatar");
    }
  } finally {
    setLoading(false);
    // Reset input để có thể upload lại cùng file
    e.target.value = '';
  }
}}

  />

  <button
    className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
    onClick={() => {
      toast.dismiss("avatar-upload-limit");
      toast.success("Maximum file size for avatar uploads is " + formatBytes(uploadLimits.avatarMaxBytes) + ".", {
        id: "avatar-upload-limit",
        duration: 2000,
        icon: "ℹ️",
      });
      document.getElementById("avatarInput")?.click();
    }}
  >
    Change Avatar
  </button>

  <button
    className="h-10 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
    onClick={async () => {
      try {
        setLoading(true);
        await updateProfile(user._id, { ...user, avatar_url: "" });
        setUser({ ...user, avatar_url: "" });
        toast.success(
          <div>
<div className="font-semibold mb-1">Avatar removed!</div>
            <div className="text-sm text-gray-500">Avatar has been removed from your account.</div>
          </div>
        );
      } catch (e) {
        toast.error("Failed to remove avatar");
      } finally {
        setLoading(false);
      }
    }}
  >
    Remove
  </button>
                </div>
              </div>

              <div className="px-6 pt-2 pb-6">
                <div className="h-px bg-blue-100 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Full Name</label>
                    {editMode ? (
                      <input
                        className="w-full rounded-none border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        type="text"
                        value={form.full_name}
                        onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <div className="w-full rounded-none border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 shadow-sm">{user.full_name || ""}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Username</label>
                    {editMode ? (
                      <input
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                        placeholder="Enter username"
                      />
                    ) : (
                      <div className="w-full rounded-none border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 shadow-sm">{user.username || ""}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Email Address</label>
                    {editMode ? (
                      <input
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    ) : (
                      <div className="w-full rounded-none border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 shadow-sm">{user.email || ""}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Status</label>
                    <div className="w-full rounded-none border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 shadow-sm">{user.status || ""}</div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Created At</label>
                    <div className="w-full rounded-none border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 shadow-sm">{user.created_at ? new Date(user.created_at).toLocaleString() : ""}</div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Updated At</label>
                    <div className="w-full rounded-none border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800 shadow-sm">{user.updated_at ? new Date(user.updated_at).toLocaleString() : ""}</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div>User information not found.</div>
          )}
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "Account" && (
        <PasswordSection />
      )}

      {/* Center Tab */}
      {activeTab === "Center" && (
        <div className="bg-white border border-blue-200 rounded-none shadow-md">
          <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between">
            <div>
              <div className="text-xl md:text-2xl font-semibold leading-tight text-slate-900">Center</div>
              <div className="mt-0.5 text-sm md:text-base leading-relaxed text-slate-600">Update which center you are currently working on</div>
            </div>
          </div>

          {/* Current Location (read-only) */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Current Location</label>
                <div className="w-full rounded-md border border-blue-100 bg-white px-3 py-2.5 text-slate-800 shadow-sm">{user?.location || user?.where || 'Not specified'}</div>
              </div>
              <div>
                <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Name</label>
                <div className="w-full rounded-md border border-blue-100 bg-white px-3 py-2.5 text-slate-800 shadow-sm">{user?.full_name || user?.username || 'Unknown'}</div>
              </div>
            </div>

            {/* My Centers List */}
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-semibold mb-3">
                <span>📍</span>
                <span>My Centers</span>
              </div>
              {loading ? (
                <div className="text-sm text-slate-600">Loading centers...</div>
              ) : myCenters.length > 0 ? (
                <div className="space-y-3">
                  {myCenters.map((center: any) => (
                    <div key={center._id || center.member_id} className="border border-slate-200 rounded-md p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="text-slate-900 font-medium">
                          {center.name || 'Unnamed Center'}
                        </div>
                        <div className="px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700">
                          {center.role_in_center || 'Member'}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        <div className="text-slate-500">Center ID: {center._id}</div>
                        {center.description && (
                          <div className="mt-1">{center.description}</div>
                        )}
                        {center.location && (
                          <div className="mt-1">📍 {center.location}</div>
                        )}
                        {center.created_at && (
                          <div className="mt-1">Joined: {new Date(center.created_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-slate-200 rounded-md p-6 text-center text-slate-600 bg-white">
                  <div className="text-2xl mb-1">🏢</div>
                  <div className="font-medium">No Centers Yet</div>
                  <div className="text-sm text-slate-500 mt-1">You are not a member of any center. Contact your administrator to be added.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Points Tab */}
      {activeTab === "Points" && (
        <div className="bg-white border border-blue-200 rounded-none shadow-md">
          <div className="px-6 py-4 border-b border-blue-100">
            <div>
              <div className="text-xl md:text-2xl font-semibold leading-tight text-slate-900">🏆 Your Points & Achievements</div>
              <div className="mt-0.5 text-sm md:text-base leading-relaxed text-slate-600">Track your points, levels, and achievements across centers</div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-5 text-sm text-slate-600">Loading points...</div>
          ) : userPoints.length > 0 ? (
            <div className="px-6 py-5 space-y-4">
              {userPoints.map((point) => {
                // Calculate level: Every 10 points = 1 level (max 10 levels)
                const currentLevel = Math.min(Math.floor(point.points / 10), 10);
                const pointsInCurrentLevel = point.points % 10;
                const pointsToNextLevel = currentLevel < 10 ? 10 - pointsInCurrentLevel : 0;
                const progressPercentage = currentLevel < 10 ? (pointsInCurrentLevel / 10) * 100 : 100;
                
                // Level names and colors - Professional Gray Theme
                const getLevelInfo = (level: number) => {
                  const levels = [
                    { name: 'Beginner', color: '#9ca3af', emoji: '🌱' },      // Gray-400
                    { name: 'Novice', color: '#6b7280', emoji: '🌿' },        // Gray-500
                    { name: 'Apprentice', color: '#4b5563', emoji: '⚡' },    // Gray-600
                    { name: 'Intermediate', color: '#374151', emoji: '💫' },  // Gray-700
                    { name: 'Skilled', color: '#1f2937', emoji: '🌟' },       // Gray-800
                    { name: 'Advanced', color: '#111827', emoji: '✨' },      // Gray-900
                    { name: 'Expert', color: '#2c2c2c', emoji: '🔥' },        // Dark Gray
                    { name: 'Master', color: '#1a1a1a', emoji: '👑' },        // Darker Gray
                    { name: 'Grand Master', color: '#0f0f0f', emoji: '💎' },  // Almost Black
                    { name: 'Legend', color: '#000000', emoji: '🏆' },        // Black
                  ];
                  return levels[level] || levels[0];
                };
                
                const levelInfo = getLevelInfo(currentLevel);
                
                return (
                  <div key={point._id} className="border border-blue-100 rounded-none p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                    {/* Card header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-slate-800 font-medium">
                        <span>📍</span>
                        <span>{point.center?.name || 'Center'}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase ${
                          (point.status || '').toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : (point.status || '').toLowerCase() === 'inactive'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : (point.status || '').toLowerCase() === 'pending'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {String(point.status || '').toUpperCase()}
                      </span>
                    </div>

                    {/* Level Display */}
                    <div className="flex items-center gap-3 bg-slate-900 text-white p-4 rounded-none mb-3" style={{backgroundColor: levelInfo.color}}>
                      <span className="text-2xl">{levelInfo.emoji}</span>
                      <div>
                        <div className="text-lg font-semibold">Level {currentLevel}</div>
                        <div className="text-sm opacity-90">{levelInfo.name}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {currentLevel < 10 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>Progress to Level {currentLevel + 1}</span>
                          <span>{pointsInCurrentLevel}/10 points</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-none overflow-hidden">
                          <div className="h-full" style={{ width: `${progressPercentage}%`, backgroundColor: levelInfo.color }} />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{pointsToNextLevel} points to next level</div>
                      </div>
                    )}

                    {currentLevel === 10 && (
                      <div className="text-sm text-green-600 mb-3">🎉 Maximum Level Reached!</div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="border border-blue-100 rounded-md p-3 bg-slate-50 shadow-sm flex items-start gap-2">
                        <span>💎</span>
                        <div>
                          <div className="text-xl font-semibold">{point.points.toLocaleString()}</div>
                          <div className="text-xs text-slate-500">Current Points</div>
                        </div>
                      </div>
                      <div className="border border-blue-100 rounded-md p-3 bg-slate-50 shadow-sm flex items-start gap-2">
                        <span>🎯</span>
                        <div>
                          <div className="text-xl font-semibold">Level {currentLevel}</div>
                          <div className="text-xs text-slate-500">{levelInfo.name}</div>
                        </div>
                      </div>
                      <div className="border border-blue-100 rounded-md p-3 bg-slate-50 shadow-sm flex items-start gap-2">
                        <span>🏆</span>
                        <div>
                          <div className="text-xl font-semibold">{point.total_points.toLocaleString()}</div>
                          <div className="text-xs text-slate-500">Total Earned</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-10 text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-lg font-medium text-slate-800">No Points Yet</div>
              <div className="text-sm text-slate-600">Start completing tasks to earn points and level up!</div>
            </div>
          )}
        </div>
      )}

      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-white border border-blue-200 rounded-none shadow-lg">
            <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between">
              <div className="text-lg font-semibold text-slate-900">Choose your avatar</div>
              <button
                className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                onClick={() => setShowAvatarPicker(false)}
              >
                Close
              </button>
            </div>
            <div className="p-6 grid grid-cols-3 sm:grid-cols-4 gap-4">
              {avatarChoices.map((src) => (
                <button
                  key={src}
                  className="border border-blue-100 rounded-md overflow-hidden bg-white hover:ring-2 ring-blue-300 transition-shadow shadow-sm"
                  onClick={async () => {
                    try {
                      setLoading(true);
                      await updateProfile(user._id, { ...user, avatar_url: src });
                      setUser({ ...user, avatar_url: src });
                      setShowAvatarPicker(false);
                      toast.success(
                        <div>
                          <div className="font-semibold mb-1">Avatar updated!</div>
                          <div className="text-sm text-gray-500">Avatar has been refreshed for the member.</div>
                        </div>
                      );
                    } catch (error) {
                      toast.error("Failed to update avatar");
                    } finally { setLoading(false); }
                  }}
                >
                  <img src={src} alt="avatar" className="h-20 w-20 object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// PasswordSection component for change password logic
function PasswordSection() {
    const [showForm, setShowForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      // Gọi API đổi mật khẩu thật
      const res = await changePassword({
        current_password: oldPassword,
        new_password: newPassword,
      });

      // Nếu thành công
      toast.success(
        <div>
          <div className="font-semibold mb-1">Password changed successfully!</div>
          <div className="text-sm text-gray-500">Please use the new password next time.</div>
        </div>
      );

      setShowForm(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-blue-200 rounded-none shadow-md">
      <div className="px-6 py-4 border-b border-blue-100">
        <div>
          <div className="text-xl md:text-2xl font-semibold leading-tight text-slate-900">Account Security</div>
          <div className="mt-0.5 text-sm md:text-base leading-relaxed text-slate-600">Manage your password and security settings</div>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-none p-4 shadow-sm">
          <div>
            <div className="text-base md:text-lg font-semibold leading-tight text-slate-800">Password</div>
            <div className="mt-0.5 text-sm leading-relaxed text-slate-600">Log in by entering your password</div>
          </div>
          <button
            className={`${showForm
              ? 'px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
              : 'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white'} rounded-md text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300`}
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full rounded-none border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  placeholder="Enter your current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-8 rounded-md text-slate-600 hover:bg-slate-100"
                >
                  {showOldPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-none border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  placeholder="Enter your new password (min 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-8 rounded-md text-slate-600 hover:bg-slate-100"
                >
                  {showNewPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-medium tracking-wider text-slate-500 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-none border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  placeholder="Re-enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-2 my-auto h-8 w-8 rounded-md text-slate-600 hover:bg-slate-100"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <div className="mt-2 text-sm text-red-600">⚠️ Mật khẩu không khớp</div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? '🔄 Saving...' : '✓ Save Password'}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:opacity-60"
                onClick={() => {
                  setShowForm(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default UserProfilePage;
