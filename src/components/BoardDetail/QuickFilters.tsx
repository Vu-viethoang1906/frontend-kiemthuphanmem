import React from 'react';
import { X } from 'lucide-react';

export type QuickFilterType = 'my_tasks' | 'due_today' | 'high_priority' | 'unassigned';

interface QuickFiltersProps {
  activeFilters: QuickFilterType[];
  onToggleFilter: (filter: QuickFilterType) => void;
  onClearAll: () => void;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  activeFilters,
  onToggleFilter,
  onClearAll,
}) => {
  const filters = [
    {
      id: 'my_tasks' as QuickFilterType,
      label: 'My Tasks',
      icon: '👤',
      description: 'Tasks assigned to me',
    },
    {
      id: 'due_today' as QuickFilterType,
      label: 'Due Today',
      icon: '📅',
      description: 'Tasks due today',
    },
    {
      id: 'high_priority' as QuickFilterType,
      label: 'High Priority',
      icon: '🔴',
      description: 'High priority tasks',
    },
    {
      id: 'unassigned' as QuickFilterType,
      label: 'Unassigned',
      icon: '❓',
      description: 'Tasks without assignee',
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onToggleFilter(filter.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={filter.description}
          >
            <span>{filter.icon}</span>
            <span>{filter.label}</span>
            {isActive && (
              <X 
                className="w-3.5 h-3.5 ml-1" 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFilter(filter.id);
                }}
              />
            )}
          </button>
        );
      })}

      {activeFilters.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
          title="Clear all filters"
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};

export default QuickFilters;
