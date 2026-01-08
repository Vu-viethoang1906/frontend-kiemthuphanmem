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
    // Flat, subtle pill styles by role
    const r = (role || "").toString();
    switch (r) {
      case "Người tạo":
      case "Creator":
      case "Owner":
        return "bg-indigo-100 text-indigo-800";
      case "Quản trị viên":
      case "Administrator":
      case "Admin":
        return "bg-amber-100 text-amber-800";
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
    // Return Vietnamese role as-is, don't translate
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
      className={`flex min-h-[200px] flex-col justify-between bg-white rounded-none border border-gray-200 p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
        isUpdating ? "animate-pulse" : ""
      }`}
      onClick={onClick}
    >
      {/* Row 1: avatar + name */}
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-blue-100"
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
            className={`h-14 w-14 rounded-full flex items-center justify-center text-white text-base font-semibold ring-2 ring-gray-100 ${
              avatarUrl ? "hidden" : "flex"
            }`}
            style={{ backgroundColor: placeholderBg }}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="truncate text-[15px] font-semibold leading-6 text-gray-900">{fullName}</h3>
        </div>
      </div>

      {/* Row 2: role (left-aligned) */}
      <div className="mt-3">
        <div className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${roleClass}`}>
          {translateRoleText(member.role_in_group)}
        </div>
      </div>

      {/* Row 3: button full width */}
      <div className="mt-5">
        <button
          className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          View User's Board
        </button>
      </div>
    </div>
  );
};

export default GroupMemberCard;