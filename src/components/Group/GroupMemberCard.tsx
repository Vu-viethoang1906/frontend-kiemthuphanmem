import React from "react";

interface GroupMemberCardProps {
  member: any;
  isUpdating?: boolean;
  baseUrl: string;
  onClick: () => void;
}

const GroupMemberCard: React.FC<GroupMemberCardProps> = ({
  member,
  isUpdating = false,
  baseUrl,
  onClick,
}) => {
  // Try to get user from different possible structures
  let user = null;
  if (typeof member.user_id === "object" && member.user_id !== null) {
    user = member.user_id;
  } else if (typeof member.user === "object" && member.user !== null) {
    user = member.user;
  }

  // Try all possible avatar field names
  const avatarPath = user?.avatar_url || user?.avatarUrl || user?.avatar || "";
  const avatarUrl = avatarPath
    ? avatarPath.startsWith("http")
      ? avatarPath
      : `${baseUrl}/${avatarPath.replace(/^\/+/, "")}`
    : "";

  const fullName = user?.full_name || "Unknown User";
  const getRoleClass = (role: string): string => {
    const r = (role || "").toString();
    switch (r) {
      case "Người tạo":
      case "Creator":
      case "Owner":
        return "bg-purple-100 text-purple-700";
      case "Quản trị viên":
      case "Administrator":
      case "Admin":
        return "bg-blue-100 text-blue-700";
      case "Người xem":
      case "Viewer":
      case "ReadOnly":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  
  const translateRoleText = (role?: string | null) => {
    if (!role) return "Thành viên";
    return role;
  };
  
  const roleClass = getRoleClass(member.role_in_group);
  const nameForColor = (fullName || "U").toString();
  const hue =
    Math.abs(
      nameForColor.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
    ) % 360;
  const placeholderBg = `hsl(${hue}, 70%, 50%)`;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
        isUpdating ? "opacity-70" : ""
      }`}
      onClick={onClick}
    >
      {/* Avatar and Name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-12 w-12 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const ph = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (ph) {
                  ph.style.display = "flex";
                }
              }}
            />
          ) : null}
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
              avatarUrl ? "hidden" : "flex"
            }`}
            style={{ backgroundColor: placeholderBg }}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{fullName}</h3>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-3">
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${roleClass}`}>
          {translateRoleText(member.role_in_group)}
        </span>
      </div>

      {/* Button */}
      <button
        className="w-full px-3 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        View Board
      </button>
    </div>
  );
};

export default GroupMemberCard;
