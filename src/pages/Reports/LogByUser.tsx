import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  UserCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchLogsByUser } from "../../api/historyTaskApi";

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

  const loadLogs = async () => {
    try {
      setLoading(true);

      const idUser = localStorage.getItem("userId") || "";

      // Lấy log theo user
      const response = await fetchLogsByUser(idUser);
      const data = response.data || [];
      console.log("Activity Logs Response:", response);
      const raw = Array.isArray(data) ? data : [];

      const normalized = raw
        .map((entry) => {
          const user = entry?.user_id;
          //

          return {
            id: entry?._id,
            taskId: entry?.target_id || null,
            taskTitle: entry?.target_type || "Unknown",
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
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      toast.error("Unable to load activity logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

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
    const placeholders = Array.from({ length: 4 });
    return (
      <div className="divide-y divide-blue-50">
        {placeholders.map((_, idx) => (
          <div key={idx} className="flex gap-4 px-4 py-5 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-blue-100" />
            <div className="flex-1">
              <div className="h-4 w-1/3 rounded bg-blue-100" />
              <div className="mt-2 h-3 w-2/3 rounded bg-blue-50" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-50 via-white to-white px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-400">
                Activity Oversight
              </p>
              <h1 className="mt-1 text-3xl font-bold text-blue-900">
                Activity Logs
              </h1>
              <p className="mt-2 text-sm text-blue-500">
                Trace every change across projects with precise filtering.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-right text-sm text-blue-500">
              <p>
                Last refreshed{" "}
                {lastUpdated ? formatDateTime(lastUpdated) : "never"}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  onClick={handleReset}
                  className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  Reset filters
                </button>
                <button
                  onClick={loadLogs}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-6">
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="lg:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                  User
                </label>
                <div className="relative mt-2">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full appearance-none rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm font-semibold text-blue-900 shadow-inner focus:border-blue-400 focus:outline-none"
                  >
                    <option value="all">All users</option>
                    {userOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.label}
                      </option>
                    ))}
                  </select>
                  <UserCircle2 className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                </div>
              </div>
              <div className="lg:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                  Search
                </label>
                <div className="relative mt-2">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search action"
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 pr-10 text-sm text-blue-900 shadow-inner placeholder:text-blue-300 focus:border-blue-400 focus:outline-none"
                  />
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                </div>
              </div>
              <div className="lg:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                  Start date
                </label>
                <div className="relative mt-2">
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
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 pr-10 text-sm text-blue-900 shadow-inner focus:border-blue-400 focus:outline-none"
                  />
                  <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                </div>
              </div>
              <div className="lg:col-span-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                  End date
                </label>
                <div className="relative mt-2">
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
                    className="w-full rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 pr-10 text-sm text-blue-900 shadow-inner focus:border-blue-400 focus:outline-none"
                  />
                  <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { id: "today", label: "Today" },
                { id: "7d", label: "Last 7 days" },
                { id: "30d", label: "Last 30 days" },
                { id: "custom", label: "Custom" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleQuickRange(preset.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    quickRange === preset.id
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-blue-200 bg-white text-blue-600 hover:border-blue-400"
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {preset.label}
                </button>
              ))}
              <button
                onClick={handleExport}
                className="ml-auto inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-500 hover:text-blue-900"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
              Total events
            </p>
            <p className="mt-2 text-4xl font-bold text-blue-900">
              {loading ? "…" : stats.total}
            </p>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
              Contributors
            </p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-4xl font-bold text-blue-900">
                {loading ? "…" : stats.users}
              </p>
              <span className="text-sm text-blue-400">unique users</span>
            </div>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
              Tasks impacted
            </p>
            <div className="mt-2 flex items-center gap-2 text-blue-900">
              <Clock className="h-5 w-5" />
              <p className="text-3xl font-bold">
                {loading ? "…" : stats.tasks}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white shadow-xl">
          <div className="flex flex-col gap-2 border-b border-blue-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-blue-900">Timeline</p>
              <p className="text-sm text-blue-500">
                {filteredLogs.length} events match your filters
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-500">
              <CalendarDays className="h-4 w-4" />
              <span>
                {dateRange.start} → {dateRange.end}
              </span>
            </div>
          </div>
          {loading ? (
            renderSkeleton()
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="rounded-full bg-blue-50 p-4">
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
              <p className="mt-4 text-xl font-semibold text-blue-900">
                Nothing to show here
              </p>
              <p className="mt-2 max-w-md text-sm text-blue-500">
                Try adjusting the date window or pick another user to see
                recorded actions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-blue-50">
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
                  <div key={log.id} className="px-6 py-5">
                    {showLabel && (
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-400">
                        {dateLabel}
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="relative mt-1 h-10 w-10 rounded-full bg-blue-100">
                          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-blue-900">
                            {log.changeType}
                          </p>
                          <p className="mt-1 text-sm text-blue-500">
                            {log.userName}
                            {log.userEmail && (
                              <span className="ml-1 text-blue-300">
                                ({log.userEmail})
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-blue-500">
                            Tager:{" "}
                            <span className="font-semibold text-blue-900">
                              {log.taskTitle}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-sm text-blue-500 sm:items-end">
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-600">
                          <Clock className="h-4 w-4" />
                          {formatDateTime(log.createdAt)}
                        </span>
                        {log.taskId && (
                          <span className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                            #{log.taskId}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
