import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import WorkForecast from "./WorkForecast";
import ExportReports from "./ExportReports";
import OverdueAnalysis from "./OverdueAnalysis";
import CollaborationIndex from "./CollaborationIndex";
import TaskQualityMetrics from "./TaskQualityMetrics";

const WorkControl: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine base path (admin or dashboard)
  const basePath = useMemo(() => {
    const path = location.pathname;
    return path.startsWith("/admin") ? "/admin" : "/dashboard";
  }, [location.pathname]);

  const workControlTabs = useMemo(
    () => [
      { label: "Work Forecast", path: `${basePath}/work-control/work-forecast`, component: WorkForecast },
      { label: "Export Reports", path: `${basePath}/work-control/export-reports`, component: ExportReports },
      { label: "Overdue Analysis", path: `${basePath}/work-control/overdue-analysis`, component: OverdueAnalysis },
      { label: "Collaboration Index", path: `${basePath}/work-control/collaboration-index`, component: CollaborationIndex },
      { label: "Task Quality Metrics", path: `${basePath}/work-control/task-quality-metrics`, component: TaskQualityMetrics },
    ],
    [basePath]
  );

  // Determine active tab based on current path
  const activeTab = useMemo(() => {
    const currentPath = location.pathname;
    const tab = workControlTabs.find(
      (tab) => currentPath === tab.path || currentPath.startsWith(tab.path)
    );
    return tab || workControlTabs[0];
  }, [location.pathname, workControlTabs]);

  const ActiveComponent = activeTab.component;

  const handleTabChange = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-white dark:bg-slate-900">
      <div className="w-full px-4 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Work Control</h1>
          </div>
          
          {/* Header Menu Tabs - Similar to AdminHome */}
          <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-2 py-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-2">
                {workControlTabs.map((tab) => {
                  const isActive = activeTab.path === tab.path;
                  return (
                    <button
                      key={tab.path}
                      onClick={() => handleTabChange(tab.path)}
                      className={`px-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                        isActive
                          ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                          : "border-transparent text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-600"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Active Component Content */}
        <div className="mt-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default WorkControl;

