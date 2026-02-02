import React from "react";

interface GroupHeaderProps {
  groupCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  disabled?: boolean;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupCount,
  searchValue,
  onSearchChange,
  onCreateClick,
  disabled = false,
}) => {
  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Group Management</h1>
          <p className="text-sm text-gray-500">Manage groups and member permissions</p>
        </div>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
          onClick={onCreateClick}
          disabled={disabled}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Group
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            placeholder="Search groups by name or description..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700">
          {groupCount} {groupCount === 1 ? 'Group' : 'Groups'}
        </div>
      </div>
    </div>
  );
};

export default GroupHeader;
