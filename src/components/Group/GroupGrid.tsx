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
      <div className="p-8">
        <div className="flex h-48 items-center justify-center border border-gray-200 bg-white">
          <p className="text-lg font-medium text-blue-600">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-8">
        <div className="flex h-48 items-center justify-center border border-gray-200 bg-white">
          <p className="text-lg font-medium text-gray-600">
            No groups found. Click "CREATE GROUP" to create a new one.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pl-4 pr-6 sm:pl-6 sm:pr-8 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
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
    </div>
  );
};

export default GroupGrid;