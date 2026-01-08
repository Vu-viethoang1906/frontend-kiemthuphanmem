import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  UserCircle2,
  Activity,
  Users,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchActivityLogs } from "../../api/historyTaskApi";

interface ActivityLogRecord {
  id: string;
  taskId?: string;
  taskTitle: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  changeType: string;
  createdAt: string;
}

const getDefaultRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState(getDefaultRange());
  const [quickRange, setQuickRange] = useState("7d");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const loadLogs = async (page = 1) => {
    try {
      setLoading(true);
      const idUser = localStorage.getItem("userId") || "";

      // Get logs with pagination
      // Note: fetchActivityLogs only takes idUser as parameter
      const response = await fetchActivityLogs(idUser);
      
      const data = response.data || [];
      const raw = Array.isArray(data) ? data : [];
      
      // If the API returns pagination info, use it
      const total = response.total || raw.length;
      setTotalItems(total);

      const normalized = raw
        .map((entry) => {
          const user = entry?.user_id;
          return {
            id: entry?._id,
            taskId: entry?.target_id || null,
            taskTitle: entry?.target_type || "Không xác định",
            userId: user?._id,
            userName:
              user?.full_name ||
              user?.username ||
              user?.email ||
              "Unknown user",
            userEmail: user?.email,
            changeType: entry?.action,
            createdAt: entry?.created_at,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setLogs(normalized);
      setCurrentPage(page);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error("Error loading activity logs:", error);
      toast.error("Unable to load activity logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(currentPage);
  }, [currentPage, itemsPerPage]);

  const userOptions = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    logs.forEach((log) => {
      const key = log.userId || log.userName;
      if (!map.has(key)) {
        map.set(key, {
          id: log.userId || log.userName,
          label: log.userName,
        });
      }
    });
    return Array.from(map.values());
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const start = dateRange.start ? new Date(dateRange.start) : null;
    const end = dateRange.end ? new Date(dateRange.end) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    return logs.filter((log) => {
      const created = new Date(log.createdAt);
      const matchesUser = selectedUser === "all" || log.userId === selectedUser;
      const matchesDate =
        (!start || created >= start) && (!end || created <= end);
      const matchesSearch = searchTerm
        ? log.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.changeType.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesUser && matchesDate && matchesSearch;
    });
  }, [logs, selectedUser, dateRange, searchTerm]);

  const stats = useMemo(() => {
    const userSet = new Set(
      filteredLogs.map((log) => log.userId || log.userName)
    );
    const taskSet = new Set(
      filteredLogs.map((log) => log.taskId || log.taskTitle)
    );
    const latest = filteredLogs[0]?.createdAt || null;
    return {
      total: filteredLogs.length,
      users: userSet.size,
      tasks: taskSet.size,
      latest,
    };
  }, [filteredLogs]);

  const handleQuickRange = (range: string) => {
    setQuickRange(range);
    if (range === "custom") {
      return;
    }
    const now = new Date();
    const end = now.toISOString().split("T")[0];
    if (range === "today") {
      setDateRange({ start: end, end });
      return;
    }
    const days = range === "30d" ? 29 : 6;
    const start = new Date();
    start.setDate(now.getDate() - days);
    setDateRange({
      start: start.toISOString().split("T")[0],
      end,
    });
  };

  const handleReset = () => {
    setSelectedUser("all");
    setSearchTerm("");
    setQuickRange("7d");
    setDateRange(getDefaultRange());
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (!filteredLogs.length) {
      toast.error("No data to export");
      return;
    }
    const header = ["Timestamp", "User", "Email", "Action", "Task", "Task ID"];
    const rows = filteredLogs.map((log) => [
      formatDateTime(log.createdAt),
      log.userName,
      log.userEmail || "",
      log.changeType,
      log.taskTitle,
      log.taskId || "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `activity_logs_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSkeleton = () => {
    const placeholders = Array.from({ length: 5 });
    return (
      <div className="space-y-4">
        {placeholders.map((_, idx) => (
          <div key={idx} className="flex gap-4 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-slate-950">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Activity Logs
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Track and monitor all activities across your projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Last refreshed: {formatDateTime(lastUpdated)}
              </span>
            )}
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={() => loadLogs(1)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? "…" : stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Contributors</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? "…" : stats.users}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Impacted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? "…" : stats.tasks}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
          <div className="space-y-4">
            {/* Filter Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User
                </label>
                <div className="relative">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                  >
                    <option value="all">All users</option>
                    {userOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                  <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search action or task"
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }));
                      setQuickRange("custom");
                    }}
                    max={dateRange.end}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }));
                      setQuickRange("custom");
                    }}
                    min={dateRange.start}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Quick Range Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-slate-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick filters:</span>
              {[
                { id: "today", label: "Today" },
                { id: "7d", label: "Last 7 days" },
                { id: "30d", label: "Last 30 days" },
                { id: "custom", label: "Custom" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleQuickRange(preset.id)}
                  className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    quickRange === preset.id
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {preset.label}
                </button>
              ))}
              <button
                onClick={handleExport}
                className="ml-auto inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Timeline</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {filteredLogs.length} {filteredLogs.length === 1 ? "event" : "events"} found
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CalendarDays className="h-4 w-4" />
                <span>
                  {dateRange.start} → {dateRange.end}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              renderSkeleton()
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full mb-4">
                  <Clock className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No activities found
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  Try adjusting your filters or date range to see activity logs.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredLogs.map((log, index) => {
                  const dateLabel = new Intl.DateTimeFormat("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(log.createdAt));
                  const previousLabel =
                    index > 0
                      ? new Intl.DateTimeFormat("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(filteredLogs[index - 1].createdAt))
                      : null;
                  const showLabel = dateLabel !== previousLabel;
                  return (
                    <div key={log.id}>
                      {showLabel && (
                        <div className="mb-4 pb-2 border-b border-gray-200 dark:border-slate-700">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {dateLabel}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                            {log.userName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {log.changeType}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <span className="font-medium">{log.userName}</span>
                                {log.userEmail && (
                                  <span className="text-gray-500 dark:text-gray-500 ml-1">
                                    ({log.userEmail})
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Task: <span className="font-medium text-gray-900 dark:text-white">{log.taskTitle}</span>
                              </p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-1">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-full">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDateTime(log.createdAt)}
                              </span>
                              {log.taskId && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  #{log.taskId.slice(-8)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Pagination */}
            {filteredLogs.length > 0 && (
              <div className="flex items-center justify-between mt-6 border-t border-gray-200 dark:border-slate-700 pt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredLogs.length + (currentPage - 1) * itemsPerPage)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md border ${currentPage === 1 
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                  >
                    Previous
                  </button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 || 
                        page === Math.ceil(totalItems / itemsPerPage) || 
                        Math.abs(page - currentPage) <= 1
                      )
                      .map((page, i, array) => (
                        <React.Fragment key={page}>
                          {i > 0 && array[i - 1] !== page - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-md flex items-center justify-center ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white'
                                : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))
                    }
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage)))}
                    disabled={currentPage * itemsPerPage >= totalItems}
                    className={`px-3 py-1.5 rounded-md border ${currentPage * itemsPerPage >= totalItems 
                      ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                      : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
