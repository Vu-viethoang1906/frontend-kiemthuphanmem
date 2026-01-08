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
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#2d7bf3] to-[#2aa0f8] py-8 text-white">
        <div className="w-full px-8">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 text-[26px] font-bold leading-tight">
                <svg
                  className="h-7 w-7 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Group Management
              </div>
              <div className="mt-1 text-[13px] text-white/90">
                Manage groups and member permissions
              </div>
            </div>
            <button
              onClick={onCreateClick}
              disabled={disabled}
              className="rounded-md bg-white/20 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.12)] hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Create Group
            </button>
          </div>

          {/* Framed search area */}
          <div className="w-full border-2 border-white bg-white/10 p-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search groups by name or description..."
                  className="h-11 w-full rounded-none border-0 bg-white px-10 text-blue-900 placeholder-blue-300 focus:outline-none"
                />
              </div>
              <div className="flex h-11 min-w-[140px] items-center justify-end bg-white px-4 text-right text-sm font-semibold text-blue-700 border-l border-blue-100">
                {groupCount} Groups
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupHeader;