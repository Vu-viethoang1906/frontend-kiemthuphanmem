import React from "react";
import GroupCard from "./GroupCard";

interface GroupGridProps {
  groups: any[];
  loading: boolean;
  memberCounts: Record<string, number>;
  userRoleMap: { [groupId: string]: string };
  onSelectGroup: (group: any) => void;
  onDeleteGroup: (groupId: string) => void;
  onEditGroup?: (group: any) => void;
}

const GroupGrid: React.FC<GroupGridProps> = ({
  groups,
  loading,
  memberCounts,
  userRoleMap,
  onSelectGroup,
  onDeleteGroup,
  onEditGroup,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-sm text-gray-600">
            No groups found. Click "Create Group" to create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {groups.map((g, idx) => (
        <GroupCard
          key={g._id || g.id || idx}
          group={g}
          memberCount={memberCounts[g._id || g.id] ?? 0}
          userRole={userRoleMap[g._id || g.id] || ""}
          onSelect={onSelectGroup}
          onDelete={onDeleteGroup}
          onEdit={onEditGroup}
        />
      ))}
    </div>
  );
};

export default GroupGrid;
