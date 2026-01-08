import React from "react";

interface GroupCardProps {
  group: any;
  memberCount: number;
  userRole: string;
  onSelect: (group: any) => void;
  onDelete: (groupId: string) => void;
  onEdit?: (group: any) => void;
}

const GroupCard: React.FC<GroupCardProps> = ({
  group,
  memberCount,
  userRole,
  onSelect,
  onDelete,
  onEdit,
}) => {
  const groupId = group._id || group.id;
  const canDelete = userRole === "Quản trị viên" || userRole === "Người tạo";
  const subtitle = group.description || "";
  const shortId = (groupId || "").slice(-6);
  const ownerName = group.owner?.name || group.owner_name || group.createdBy?.full_name || "";

  return (
    <div 
      className="bg-white border border-gray-200 p-0 cursor-pointer transition-all duration-200 hover:border-blue-600 hover:-translate-y-[2px] group"
      onClick={() => onSelect(group)}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-200 p-4">
        <div className="min-w-0">
          <div className="text-[18px] font-bold text-gray-900 truncate">{group.name}</div>
        </div>
        <div className="ml-3 shrink-0">
          <span className="inline-flex items-center rounded-md bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">HOẠT ĐỘNG</span>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-3 p-4">
        {ownerName && (
          <div className="border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{ownerName}</div>
        )}
        {shortId && (
          <div className="border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">ID: {shortId}</div>
        )}
        {subtitle && (
          <div className="border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{subtitle}</div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 border-t border-gray-200 p-4">
        <div className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 text-sm">
          <span className="font-bold text-gray-900">{memberCount ?? 0}</span>
          <span className="text-gray-600">members</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-start gap-3 border-t border-gray-200 p-4">
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(group);
          }}
        >
          View
        </button>
        {canDelete && (
          <button
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(groupId);
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupCard;