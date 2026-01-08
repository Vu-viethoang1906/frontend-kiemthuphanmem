import React, { useState, useEffect, useMemo } from "react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { useSearchParams } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { getLineChartData, getBoardPerformance } from "../../api/analyticsApi";
import { fetchMyBoards } from "../../api/boardApi";
import { fetchTasksByBoard } from "../../api/taskApi";
import { getMe } from "../../api/authApi";
import toast from "react-hot-toast";
import {
  BarChart3,
  PieChart,
  UsersRound,
  Download,
  FileDown,
  Loader2,
  Search as SearchIcon,
  X as XIcon,
  ClipboardList,
  CheckCircle2,
  Timer,
  AlertTriangle,
  TrendingUp,
  Flag,
  Layers,
  Columns,
  AlertCircle,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

interface ChartDataPoint {
  date: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

const Reports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [granularity, setGranularity] = useState<"day" | "week" | "month">(
    "day"
  );
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
  });

  // Task modal states
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [modalTaskType, setModalTaskType] = useState<
    "total" | "completed" | "inProgress" | "overdue"
  >("total");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

    useEffect(() => {
    const boardId = searchParams.get("board");
    const granularityParam = searchParams.get("granularity");
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    if (boardId) {
      setSelectedBoardId(boardId);
    }
    if (
      granularityParam &&
      ["day", "week", "month"].includes(granularityParam)
    ) {
      setGranularity(granularityParam as "day" | "week" | "month");
    }
    if (startDate) {
      setDateRange((prev) => ({ ...prev, start: startDate }));
    }
    if (endDate) {
      setDateRange((prev) => ({ ...prev, end: endDate }));
    }
  }, [searchParams]);

    const updateURL = (
    boardId?: string,
    granularityParam?: string,
    start?: string,
    end?: string
  ) => {
    const newParams = new URLSearchParams(searchParams);

    if (boardId) {
      newParams.set("board", boardId);
    }
    if (granularityParam) {
      newParams.set("granularity", granularityParam);
    }
    if (start) {
      newParams.set("start", start);
    }
    if (end) {
      newParams.set("end", end);
    }

    setSearchParams(newParams);
  };

    useEffect(() => {
    const loadBoards = async () => {
      try {
        const boardsRes = await fetchMyBoards();
        

        let boards: any[] = [];
        if (boardsRes?.data) {
          boards = Array.isArray(boardsRes.data)
            ? boardsRes.data
            : [boardsRes.data];
        } else if (Array.isArray(boardsRes)) {
          boards = boardsRes;
        }

        

        const validBoards = boards.filter((b) => b && (b._id || b.id));

        setBoards(validBoards);
        if (validBoards.length > 0) {
          if (!selectedBoardId) {
            const firstBoardId = validBoards[0]._id || validBoards[0].id;
            setSelectedBoardId(firstBoardId);
            updateURL(firstBoardId);
          }
        }
      } catch (error) {
        toast.error("Failed to load board list");
      } finally {
        setLoading(false);
      }
    };
    loadBoards();
  }, []);

    useEffect(() => {
    const loadChartData = async () => {
      if (!selectedBoardId) {
        return;
      }
      try {
        setLoading(true);

        const isAll = selectedBoardId === 'all';

        if (isAll) {
          const boardIds = (boards || [])
            .map((b) => b && (b._id || b.id))
            .filter(Boolean) as string[];

          try {
            const chartPromises = boardIds.map((bid) =>
              getLineChartData({
                board_id: bid,
                start_date: dateRange.start,
                end_date: dateRange.end,
                granularity: granularity,
              }).catch(() => null)
            );
            const chartResults = await Promise.all(chartPromises);
            const mapByDate = new Map<string, { date: string; total: number; completed: number; inProgress: number; overdue: number }>();
            chartResults.forEach((res) => {
              const arr = res?.success && res?.data?.data ? res.data.data : [];
              if (Array.isArray(arr)) {
                arr.forEach((pt: any) => {
                  const key = pt.date;
                  if (!mapByDate.has(key)) {
                    mapByDate.set(key, { date: key, total: 0, completed: 0, inProgress: 0, overdue: 0 });
                  }
                  const cur = mapByDate.get(key)!;
                  cur.total += Number(pt.total || 0);
                  cur.completed += Number(pt.completed || 0);
                  cur.inProgress += Number(pt.inProgress || 0);
                  cur.overdue += Number(pt.overdue || 0);
                });
              }
            });
            const merged = Array.from(mapByDate.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setChartData(merged);
          } catch {
            setChartData([]);
          }

          try {
            const statsPromises = boardIds.map((bid) => getBoardPerformance(bid).catch(() => null));
            const statsResults = await Promise.all(statsPromises);
            let sum = { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0, completionRate: 0 };
            statsResults.forEach((res) => {
              const s = res?.success && res?.data?.stats ? res.data.stats : null;
              if (s) {
                sum.totalTasks += Number(s.totalTasks || 0);
                sum.completedTasks += Number(s.completedTasks || 0);
                sum.inProgressTasks += Number(s.inProgressTasks || 0);
                sum.overdueTasks += Number(s.overdueTasks || 0);
              }
            });
            sum.completionRate = sum.totalTasks > 0 ? Math.round((sum.completedTasks / sum.totalTasks) * 100) : 0;
            setStats(sum);
          } catch {
          }

          try {
            const taskPromises = boardIds.map((bid) => fetchTasksByBoard(bid).catch(() => []));
            const taskResults = await Promise.all(taskPromises);
            const mergedTasks: any[] = [];
            taskResults.forEach((tr) => {
              if (Array.isArray(tr)) {
                mergedTasks.push(...tr);
              } else if (tr?.success && Array.isArray(tr?.data)) {
                mergedTasks.push(...tr.data);
              } else if (Array.isArray(tr?.data)) {
                mergedTasks.push(...tr.data);
              }
            });
            setAllTasks(mergedTasks);
          } catch {
            setAllTasks([]);
          }
        } else {
          try {
            const chartRes = await getLineChartData({
              board_id: selectedBoardId,
              start_date: dateRange.start,
              end_date: dateRange.end,
              granularity: granularity,
            });

            if (chartRes?.success && chartRes?.data && chartRes?.data?.data) {
              setChartData(chartRes.data.data);
            } else {
              setChartData([]);
            }
          } catch (chartError: any) {
            setChartData([]);
          }

          try {
            const statsRes = await getBoardPerformance(selectedBoardId);
            if (statsRes?.success && statsRes?.data && statsRes?.data?.stats) {
              setStats(statsRes.data.stats);
            } else {
            }
          } catch (statsError: any) {}

          try {
            const tasksRes = await fetchTasksByBoard(selectedBoardId);
            let tasksData = [] as any[];
            if (Array.isArray(tasksRes)) {
              tasksData = tasksRes;
            } else if (tasksRes?.success && Array.isArray(tasksRes?.data)) {
              tasksData = tasksRes.data;
            } else if (Array.isArray(tasksRes?.data)) {
              tasksData = tasksRes.data;
            }
            setAllTasks(Array.isArray(tasksData) ? tasksData : []);
          } catch (tasksError: any) {
            setAllTasks([]);
          }
        }
      } catch (error) {
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [selectedBoardId, dateRange, granularity]);

  const prepareChartData = () => {
    const data = Array.isArray(chartData) ? chartData : [];

    const labels = data.map((d) => {
      const date = new Date(d.date);
      if (granularity === "day") {
        return date.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
        });
      } else if (granularity === "week") {
        return `Week ${Math.ceil(date.getDate() / 7)}`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Total tasks",
          data: data.map((d) => d.total || 0),
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.15)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: "#667eea",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: "#667eea",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
        {
          label: "Completed",
          data: data.map((d) => d.completed || 0),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.15)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: "#10b981",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
        {
          label: "In progress",
          data: data.map((d) => d.inProgress || 0),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: "#f59e0b",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: "#f59e0b",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
        {
          label: "Overdue",
          data: data.map((d) => d.overdue || 0),
          borderColor: "#ef4444",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: "#ef4444",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: "#ef4444",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
        },
      ],
    };
  };

const doughnutPercentPlugin: any = {
  id: "doughnutPercentPlugin",
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    const dataset = chart.data.datasets?.[0];
    if (!dataset) return;
    const data: number[] = (dataset.data as number[]) || [];
    const total = Number(stats.totalTasks) || 0;
    if (!total) return;

    const meta = chart.getDatasetMeta(0);
    data.forEach((value, index) => {
      const val = Number(value) || 0;
      if (val <= 0) return;
      const percent = total > 0 ? val / total : 0;
      if (percent < 0.06) return;
      const arc = meta.data[index];
      if (!arc) return;
      const props = arc.getProps([
        "x",
        "y",
        "startAngle",
        "endAngle",
        "innerRadius",
        "outerRadius",
      ], true);
      const angle = (props.startAngle + props.endAngle) / 2;
      const r = (props.innerRadius + props.outerRadius) / 2;
      const tx = props.x + Math.cos(angle) * r;
      const ty = props.y + Math.sin(angle) * r;

      ctx.save();
      ctx.fillStyle = "#111827";
      ctx.font = "600 12px 'Inter', 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${Math.round(percent * 100)}%`, tx, ty);
      ctx.restore();
    });
  },
};

const getFilteredTasks = () => {
  const now = new Date();
  let filtered = [...allTasks];

  const isTaskCompleted = (task: any) => {
    if (!task.column_id) return false;
    if (task.column_id.isDone === true) return true;
    const columnName = task.column_id?.name || "";
    return (
      columnName.toLowerCase().includes("done") ||
      columnName.toLowerCase().includes("hoàn thành")
    );
  };

  switch (modalTaskType) {
    case "completed":
      filtered = filtered.filter((task) => isTaskCompleted(task));
      break;
    case "inProgress":
      filtered = filtered.filter((task) => !isTaskCompleted(task));
      break;
    case "overdue":
      filtered = filtered.filter((task) => {
        const dueDate = task.due_date ? new Date(task.due_date) : null;
        return dueDate && dueDate < now && !isTaskCompleted(task);
      });
      break;
    case "total":
    default:
      break;
  }

  if (taskSearchQuery.trim()) {
    const query = taskSearchQuery.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
    );
  }

  return filtered;
};

  const handleStatCardClick = (
    type: "total" | "completed" | "inProgress" | "overdue"
  ) => {
    setModalTaskType(type);
    setTaskSearchQuery("");
    setShowTaskModal(true);
  };

  const getModalTaskCount = () => {
    if (taskSearchQuery.trim()) {
      return getFilteredTasks().length;
    }

    switch (modalTaskType) {
      case "total":
        return stats.totalTasks || 0;
      case "completed":
        return stats.completedTasks || 0;
      case "inProgress":
        return stats.inProgressTasks || 0;
      case "overdue":
        return stats.overdueTasks || 0;
      default:
        return 0;
    }
  };

  const preparePieChartData = () => {
    return {
      labels: ["Completed", "In progress", "Overdue"],
      datasets: [
        {
          data: [
            stats.completedTasks,
            stats.inProgressTasks,
            stats.overdueTasks,
          ],
          backgroundColor: [
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: ["#10b981", "#f59e0b", "#ef4444"],
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };
  };

  const getTeamPerformance = useMemo(() => {
    if (!allTasks.length) return [];

    const userTasksMap = new Map<
      string,
      { completed: number; total: number; name: string }
    >();

    allTasks.forEach((task) => {
      const assignedUser = task.assigned_to;
      if (!assignedUser) return;

      const userId = assignedUser._id || assignedUser.id;
      const userName =
        assignedUser.full_name || assignedUser.username || "Unknown";

      if (!userTasksMap.has(userId)) {
        userTasksMap.set(userId, { completed: 0, total: 0, name: userName });
      }

      const userStats = userTasksMap.get(userId)!;
      userStats.total++;

      const col = task.column_id;
      const columnName = col?.name || "";
      const isCompleted = col?.isDone === true ||
        columnName.toLowerCase().includes("done") ||
        columnName.toLowerCase().includes("completed") ||
        columnName.toLowerCase().includes("hoàn thành");
      if (isCompleted) {
        userStats.completed++;
      }
    });
    return Array.from(userTasksMap.entries())
      .map(([userId, stats]) => ({
        userId,
        name: stats.name,
        completed: stats.completed,
        total: stats.total,
        completionRate:
          stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
      }))
      // Sắp xếp: completed desc, rồi completionRate desc, cuối cùng total desc
      .sort((a, b) =>
        b.completed - a.completed || b.completionRate - a.completionRate || b.total - a.total
      )
      .slice(0, 5); // Top 5 contributors
  }, [allTasks]);

  const getColumnDistribution = useMemo(() => {
    if (!allTasks.length) return [];

    const columnMap = new Map<
      string,
      { name: string; count: number; completed: number }
    >();

    allTasks.forEach((task) => {
      const column = task.column_id;
      if (!column) return;

      const columnName = (column.name || "Unnamed Column").trim();
      const normalizedColumnName = columnName.toLowerCase();

      if (!columnMap.has(normalizedColumnName)) {
        columnMap.set(normalizedColumnName, { name: columnName, count: 0, completed: 0 });
      }

      const colStats = columnMap.get(normalizedColumnName)!;
      colStats.count++;

      const isCompleted =
        column.isDone === true ||
        normalizedColumnName.includes("done") ||
        normalizedColumnName.includes("completed") ||
        normalizedColumnName.includes("hoàn thành");

      if (isCompleted) {
        colStats.completed++;
      }
    });

    return Array.from(columnMap.values())
      .map((col) => ({
        name: col.name,
        count: col.count,
        completed: col.completed,
        inProgress: col.count - col.completed,
        completionRate:
          col.count > 0 ? Math.round((col.completed / col.count) * 100) : 0,
      }))
      .sort((a, b) => {
        const isADone = a.name.toLowerCase().includes("done") || 
                        a.name.toLowerCase().includes("completed") ||
                        a.name.toLowerCase().includes("hoàn thành");
        const isBDone = b.name.toLowerCase().includes("done") || 
                        b.name.toLowerCase().includes("completed") ||
                        b.name.toLowerCase().includes("hoàn thành");
                        
        if (isADone && !isBDone) return -1;
        if (!isADone && isBDone) return 1;
        return b.count - a.count;
      });
  }, [allTasks]);

  const getPriorityStatistics = useMemo(() => {
    if (!allTasks.length) {
      return {
        high: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
        medium: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
        low: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
        unassigned: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
      };
    }

    const now = new Date();
    const priorityStats = {
      high: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
      medium: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
      low: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
      unassigned: { total: 0, completed: 0, inProgress: 0, overdue: 0 },
    };

    allTasks.forEach((task) => {
      const priority = (task.priority || "").toLowerCase();
      const column = task.column_id;
      const columnName = column?.name || "";
      const isCompleted =
        column?.isDone === true ||
        columnName.toLowerCase().includes("done") ||
        columnName.toLowerCase().includes("completed") ||
        columnName.toLowerCase().includes("hoàn thành");

      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const isOverdue = dueDate && dueDate < now && !isCompleted;

      let targetPriority: "high" | "medium" | "low" | "unassigned" =
        "unassigned";
      if (priority === "high") targetPriority = "high";
      else if (priority === "medium") targetPriority = "medium";
      else if (priority === "low") targetPriority = "low";

      const stats = priorityStats[targetPriority];
      stats.total++;

      if (isCompleted) {
        stats.completed++;
      } else if (isOverdue) {
        stats.overdue++;
      } else {
        stats.inProgress++;
      }
    });

    return priorityStats;
  }, [allTasks]);

  const prepareColumnChartData = () => {
    const columnData = getColumnDistribution;
    if (!columnData.length) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: columnData.map((col) => col.name),
      datasets: [
        {
          label: "Total tasks",
          data: columnData.map((col) => col.count),
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "#667eea",
          borderWidth: 2,
        },
        {
          label: "Completed",
          data: columnData.map((col) => col.completed),
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "#10b981",
          borderWidth: 2,
        },
        {
          label: "In progress",
          data: columnData.map((col) => col.inProgress),
          backgroundColor: "rgba(245, 158, 11, 0.8)",
          borderColor: "#f59e0b",
          borderWidth: 2,
        },
      ],
    };
  };

  const preparePriorityChartData = () => {
    const priorityData = getPriorityStatistics;
    return {
      labels: ["High", "Medium", "Low", "Unassigned"],
      datasets: [
        {
          label: "Total",
          data: [
            priorityData.high.total,
            priorityData.medium.total,
            priorityData.low.total,
            priorityData.unassigned.total,
          ],
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "#667eea",
          borderWidth: 2,
        },
        {
          label: "Completed",
          data: [
            priorityData.high.completed,
            priorityData.medium.completed,
            priorityData.low.completed,
            priorityData.unassigned.completed,
          ],
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "#10b981",
          borderWidth: 2,
        },
        {
          label: "In progress",
          data: [
            priorityData.high.inProgress,
            priorityData.medium.inProgress,
            priorityData.low.inProgress,
            priorityData.unassigned.inProgress,
          ],
          backgroundColor: "rgba(245, 158, 11, 0.8)",
          borderColor: "#f59e0b",
          borderWidth: 2,
        },
        {
          label: "Overdue",
          data: [
            priorityData.high.overdue,
            priorityData.medium.overdue,
            priorityData.low.overdue,
            priorityData.unassigned.overdue,
          ],
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderColor: "#ef4444",
          borderWidth: 2,
        },
      ],
    };
  };

  // Export to CSV
  const exportToCSV = (
    filename?: string,
    options?: {
      includeHeaders?: boolean;
      filterByRange?: boolean;
      dateField?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    // Get tasks filtered by modal search and then optionally by date range field
    const baseTasks = getFilteredTasks();
    let tasksToExport = baseTasks;
    if (options?.filterByRange) {
      const field = options.dateField || "created_at";
      const start = options.startDate ? new Date(options.startDate) : new Date(dateRange.start);
      const end = options.endDate ? new Date(options.endDate) : new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      tasksToExport = baseTasks.filter((t: any) => {
        const val = t[field];
        if (!val) return false;
        const d = new Date(val);
        return !isNaN(d.getTime()) && d >= start && d <= end;
      });
    }

    const boardName =
      boards.find((b) => (b._id || b.id) === selectedBoardId)?.title ||
      "Unknown";

    const headers = [
      "Task ID",
      "Title",
      "Description",
      "Status",
      "Column",
      "Assigned To",
      "Assigned Email",
      "Priority",
      "Start Date",
      "Due Date",
      "Estimated Hours",
      "Actual Hours",
      "Tag",
      "Tag Color",
      "Created Date",
      "Updated Date",
      "Board",
      "Overdue",
    ];

    const rows = tasksToExport.map((task) => {
      const now = new Date();
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const columnName = task.column_id?.name || "";
      const isCompleted =
        columnName.toLowerCase().includes("done") ||
        columnName.toLowerCase().includes("completed") ||
        columnName.toLowerCase().includes("hoàn thành");
      const isOverdue = dueDate && dueDate < now && !isCompleted;

      let status = "In progress";
      if (isCompleted) status = "Completed";
      else if (isOverdue) status = "Overdue";

      return [
        task._id || task.id || "",
        task.title || "",
        (task.description || "").replace(/"/g, '""').replace(/\n/g, " "), // Escape quotes and newlines
        status,
        columnName,
        task.assigned_to?.full_name || task.assigned_to?.username || "",
        task.assigned_to?.email || "",
        task.priority || "",
        task.start_date
          ? new Date(task.start_date).toLocaleDateString("en-US")
          : "",
        task.due_date
          ? new Date(task.due_date).toLocaleDateString("en-US")
          : "",
        task.estimated_hours || "",
        task.actual_hours || "",
        task.tag?.name || "",
        task.tag?.color || "",
        task.created_at
          ? new Date(task.created_at).toLocaleString("en-US")
          : "",
        task.updated_at
          ? new Date(task.updated_at).toLocaleString("en-US")
          : "",
        boardName,
        isOverdue ? "Yes" : "No",
      ];
    });

    const csvRows = options?.includeHeaders === false ? [] : [headers.join(",")];
    const csvContent = [
      ...csvRows,
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    if (filename && typeof filename === "string" && filename.trim() !== "") {
      // ensure .csv extension
      const safe = filename.trim().replace(/\s+/g, "_");
      link.download = safe.endsWith(".csv") ? safe : `${safe}.csv`;
    } else {
      link.download = `tasks_report_${boardName.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.csv`;
    }

    // append to DOM to ensure click works across browsers, then remove and revoke
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 100);
    }
  };

  // Export complete report to JSON
  const exportChartData = (
    filename?: string,
    options?: {
      includeChartData?: boolean;
      includeTeamPerformance?: boolean;
      filterByRange?: boolean;
      dateField?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const boardName =
      boards.find((b) => (b._id || b.id) === selectedBoardId)?.title ||
      "Unknown";

    // base tasks from filters/search
    const baseTasks = getFilteredTasks();

    // apply optional date-range filtering
    let tasksToExport = baseTasks;
    if ((options as any)?.filterByRange) {
      const field = (options as any).dateField || "created_at";
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      tasksToExport = baseTasks.filter((t: any) => {
        const val = t[field];
        if (!val) return false;
        const d = new Date(val);
        return !isNaN(d.getTime()) && d >= start && d <= end;
      });
    }

    // Add computed fields to tasks
    const tasksWithDetails = tasksToExport.map((task) => {
      const now = new Date();
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const columnName = task.column_id?.name || "";
      const isCompleted =
        columnName.toLowerCase().includes("done") ||
        columnName.toLowerCase().includes("completed") ||
        columnName.toLowerCase().includes("hoàn thành");
      const isOverdue = dueDate && dueDate < now && !isCompleted;

      let status = "in_progress";
      if (isCompleted) status = "completed";
      else if (isOverdue) status = "overdue";

      return {
        ...task,
        computed_status: status,
        is_overdue: isOverdue,
        is_completed: isCompleted,
      };
    });

    // recompute statistics from exported tasks
    const statistics = {
      total_tasks: tasksWithDetails.length,
      completed_tasks: tasksWithDetails.filter((t) => t.is_completed).length,
      in_progress_tasks: tasksWithDetails.filter((t) => !t.is_completed && !t.is_overdue).length,
      overdue_tasks: tasksWithDetails.filter((t) => t.is_overdue).length,
    } as any;
    statistics.completion_rate = statistics.total_tasks > 0 ? Math.round((statistics.completed_tasks / statistics.total_tasks) * 100) : 0;

    const data: any = {
      report_info: {
        board_name: boardName,
        board_id: selectedBoardId,
        date_range: dateRange,
        granularity,
        exported_at: new Date().toISOString(),
        export_date: new Date().toLocaleString("en-US"),
        total_tasks_exported: tasksWithDetails.length,
      },
      statistics,
      tasks: tasksWithDetails,
    };

    if ((options as any)?.includeChartData !== false) {
      // chartData is already based on selected dateRange in the UI
      data.chart_data = chartData;
    }

    if ((options as any)?.includeTeamPerformance !== false) {
      // compute team performance from exported tasks
      const userTasksMap = new Map();
      tasksWithDetails.forEach((task: any) => {
        const assignedUser = task.assigned_to;
        if (!assignedUser) return;
        const userId = assignedUser._id || assignedUser.id || assignedUser;
        const userName = assignedUser.full_name || assignedUser.username || 'Unknown';
        if (!userTasksMap.has(userId)) {
          userTasksMap.set(userId, { completed: 0, total: 0, name: userName });
        }
        const u = userTasksMap.get(userId);
        u.total++;
        if (task.is_completed) u.completed++;
      });
      const teamPerf = Array.from(userTasksMap.entries()).map(([userId, s]: any) => ({
        userId,
        name: s.name,
        completed: s.completed,
        total: s.total,
        completionRate: s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0,
      })).sort((a: any, b: any) => b.completed - a.completed || b.completionRate - a.completionRate || b.total - a.total).slice(0,5);
      data.team_performance = teamPerf;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    if (filename && typeof filename === "string" && filename.trim() !== "") {
      const safe = filename.trim().replace(/\s+/g, "_");
      link.download = safe.endsWith(".json") ? safe : `${safe}.json`;
    } else {
      link.download = `full_report_${boardName.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.json`;
    }

    // append to DOM to ensure click works across browsers, then remove and revoke
    document.body.appendChild(link);
    try {
      link.click();
    } finally {
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
        if (link.parentNode) link.parentNode.removeChild(link);
      }, 100);
    }
  };

  // Export modal state and helpers
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState("");
  const [exportSelections, setExportSelections] = useState({
    csv: true,
    json: true,
  });
  const [exportOptions, setExportOptions] = useState({
    includeHeaders: true,
    includeChartData: true,
    includeTeamPerformance: true,
    filterByRange: false,
    dateField: "created_at", // created_at | start_date | due_date
  });
  // Export modal date-range (allows user to choose from..to.. inside modal)
  const [exportDateRange, setExportDateRange] = useState({
    start: dateRange.start,
    end: dateRange.end,
  });

  const openExportModal = (preset?: "csv" | "json") => {
    // preset toggles selection and seeds filename
    const boardName =
      boards.find((b) => (b._id || b.id) === selectedBoardId)?.title ||
      "board";
    const date = new Date().toISOString().split("T")[0];
    setExportFilename(`${boardName.replace(/\s+/g, "_")}_report_${date}`);
    setExportSelections({ csv: preset !== "json", json: preset !== "csv" });
    // seed modal date-range from current filters
    setExportDateRange({ start: dateRange.start, end: dateRange.end });
    setExportModalOpen(true);
  };

  const performExports = () => {
    if (!exportSelections.csv && !exportSelections.json) {
      toast.error("Please select at least one export type");
      return;
    }

    const filenameBase = exportFilename && exportFilename.trim() !== "" ? exportFilename.trim() : undefined;

    const commonOptions = {
      includeChartData: exportOptions.includeChartData,
      includeTeamPerformance: exportOptions.includeTeamPerformance,
      includeHeaders: exportOptions.includeHeaders,
      filterByRange: exportOptions.filterByRange,
      dateField: exportOptions.dateField,
      // pass modal-chosen start/end (if user adjusted them)
      startDate: exportDateRange.start,
      endDate: exportDateRange.end,
    } as any;

    if (exportSelections.csv) {
      exportToCSV(filenameBase ? `${filenameBase}.csv` : undefined, commonOptions);
    }

    if (exportSelections.json) {
      exportChartData(filenameBase ? `${filenameBase}.json` : undefined, commonOptions);
    }

    setExportModalOpen(false);
    toast.success("Download started...");
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          font: {
            size: 14,
            weight: 600,
            family: "'Inter', 'Segoe UI', sans-serif",
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
        },
      },
      title: {
        display: true,
        text: "📈 Work progress over time",
        font: {
          size: 22,
          weight: "bold" as const,
          family: "'Inter', 'Segoe UI', sans-serif",
        },
        padding: {
          top: 10,
          bottom: 30,
        },
        color: "#2c3e50",
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        titleColor: "#2c3e50",
        bodyColor: "#5f6368",
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        padding: 16,
        boxPadding: 8,
        titleFont: {
          size: 15,
          weight: 700,
          family: "'Inter', 'Segoe UI', sans-serif",
        },
        bodyFont: {
          size: 14,
          weight: 500,
          family: "'Inter', 'Segoe UI', sans-serif",
        },
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return `📅 ${context[0].label}`;
          },
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            const icons: any = {
              "Total tasks": "📋",
              "Completed": "✅",
              "In progress": "⏳",
              "Overdue": "⚠️",
            };
            return `${icons[label] || ""} ${label}: ${value}`;
          },
          afterBody: (context: any) => {
            const dataIndex = context[0].dataIndex;
            const point = chartData[dataIndex];
            if (point) {
              const rate =
                point.total > 0
                  ? ((point.completed / point.total) * 100).toFixed(1)
                  : "0.0";
              return `\n🎯 Completion: ${rate}%`;
            }
            return "";
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
            weight: 500,
          },
          color: "#5f6368",
          padding: 10,
        },
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
          drawBorder: false,
          lineWidth: 1,
        },
        border: {
          display: false,
        },
      },
      x: {
        ticks: {
          font: {
            size: 12,
            weight: 500,
          },
          color: "#5f6368",
          padding: 10,
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
          drawBorder: false,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "index" as const,
      axis: "x" as const,
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
        borderCapStyle: "round" as const,
      },
      point: {
        radius: 4,
        hoverRadius: 8,
        hitRadius: 10,
        borderWidth: 2,
        hoverBorderWidth: 3,
      },
    },
    animation: {
      duration: 1500,
      easing: "easeInOutQuart" as const,
    },
    hover: {
      mode: "index" as const,
      intersect: false,
    },
  };

  if (loading && boards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="uppercase text-sm tracking-wider font-semibold text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!loading && boards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-4 shadow-sm text-white">
          <h1 className="text-lg font-bold">Reports & Analytics</h1>
          <p className="text-white/90 mt-1">Monitor work progress and performance</p>
        </div>
        <div className="bg-white border shadow-sm mt-6 p-10 text-center">
          <p className="text-slate-700 font-medium">No boards available</p>
          <span className="text-slate-500">Create a board to see reports</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 md:px-8 py-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5 shadow-sm text-white">
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Report</h1>
            <p className="text-white/90 mt-0.5">Monitor work progress and performance</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border shadow-sm mt-6 p-4 md:p-6 flex flex-wrap items-end gap-4 md:gap-6">
        <div className="flex flex-col gap-2 min-w-[220px]">
          <label className="text-[12px] uppercase font-semibold text-slate-600">Board</label>
          <select
            value={selectedBoardId}
            onChange={(e) => {
              setSelectedBoardId(e.target.value);
              updateURL(e.target.value);
            }}
            className="rounded-md border border-slate-300 bg-white h-11 px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <option value="all">All boards</option>
            {boards.map((board) => {
              const boardId = board._id || board.id || "";
              const boardName = board.title || board.name || "Untitled Board";
              return (
                <option key={boardId} value={boardId}>
                  {boardName}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-[12px] uppercase font-semibold text-slate-600">Granularity</label>
          <select
            value={granularity}
            onChange={(e) => {
              const newGranularity = e.target.value as "day" | "week" | "month";
              setGranularity(newGranularity);
              updateURL(undefined, newGranularity);
            }}
            className="rounded-md border border-slate-300 bg-white h-11 px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <option value="day">By day</option>
            <option value="week">By week</option>
            <option value="month">By month</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-[12px] uppercase font-semibold text-slate-600">From</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => {
              const newStart = e.target.value;
              setDateRange({ ...dateRange, start: newStart });
              updateURL(undefined, undefined, newStart);
            }}
            className="rounded-md border border-slate-300 bg-white h-11 px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          />
        </div>

        <div className="flex flex-col gap-2 min-w-[200px]">
          <label className="text-[12px] uppercase font-semibold text-slate-600">To</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => {
              const newEnd = e.target.value;
              setDateRange({ ...dateRange, end: newEnd });
              updateURL(undefined, undefined, undefined, newEnd);
            }}
            className="rounded-md border border-slate-300 bg-white h-11 px-3 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          />
        </div>

        {/* Export Button (single) */}
        <div className="ml-auto self-end flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white px-3 py-2 text-sm font-semibold shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition"
            onClick={() => openExportModal()}
            title="Export report"
            aria-label="Open export modal"
          >
            <FileDown className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <button onClick={() => handleStatCardClick('total')} className="bg-white border p-4 shadow-sm hover:bg-slate-50 transition text-left flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <span className="w-10 h-10 flex items-center justify-center bg-blue-50 border border-blue-100">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </span>
          <div>
            <div className="text-slate-600 text-xs uppercase font-semibold">Total tasks</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalTasks || 0}</div>
            <div className="text-slate-500 text-xs">Click to view details</div>
          </div>
        </button>

        <button onClick={() => handleStatCardClick('completed')} className="bg-white border p-4 shadow-sm hover:bg-slate-50 transition text-left flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <span className="w-10 h-10 flex items-center justify-center bg-emerald-50 border border-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </span>
          <div>
            <div className="text-slate-600 text-xs uppercase font-semibold">Completed</div>
            <div className="text-2xl font-bold text-slate-900">{stats.completedTasks || 0}</div>
            <div className="text-slate-500 text-xs">Click to view details</div>
          </div>
        </button>

        <button onClick={() => handleStatCardClick('inProgress')} className="bg-white border p-4 shadow-sm hover:bg-slate-50 transition text-left flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <span className="w-10 h-10 flex items-center justify-center bg-amber-50 border border-amber-100">
            <Timer className="h-5 w-5 text-amber-600" />
          </span>
          <div>
            <div className="text-slate-600 text-xs uppercase font-semibold">In progress</div>
            <div className="text-2xl font-bold text-slate-900">{stats.inProgressTasks || 0}</div>
            <div className="text-slate-500 text-xs">Click to view details</div>
          </div>
        </button>

        <button onClick={() => handleStatCardClick('overdue')} className="bg-white border p-4 shadow-sm hover:bg-slate-50 transition text-left flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          <span className="w-10 h-10 flex items-center justify-center bg-rose-50 border border-rose-100">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </span>
          <div>
            <div className="text-slate-600 text-xs uppercase font-semibold">Overdue</div>
            <div className="text-2xl font-bold text-rose-600">{stats.overdueTasks || 0}</div>
            <div className="text-slate-500 text-xs">Click to view details</div>
          </div>
        </button>

        <div className="bg-white border p-4 shadow-sm xl:col-span-3">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 flex items-center justify-center bg-indigo-50 border border-indigo-100">📈</span>
            <div className="flex-1">
              <div className="text-slate-600 text-xs uppercase font-semibold">Completion rate</div>
              <div className="text-2xl font-bold text-slate-900">{(stats.completionRate || 0).toFixed(1)}%</div>
              <div className="mt-2 h-2 bg-slate-200 overflow-hidden">
                <div className={`h-full ${ (stats.completionRate || 0) >= 70 ? 'bg-emerald-500' : (stats.completionRate || 0) >= 40 ? 'bg-amber-500' : 'bg-rose-500' }`} style={{ width: `${stats.completionRate || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Priority Statistics Cards */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">Priority Statistics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* High Priority Card */}
          <div className="bg-white border p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 flex items-center justify-center bg-rose-50 border border-rose-100">
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </span>
              <div>
                <div className="text-slate-600 text-xs uppercase font-semibold">High Priority</div>
                <div className="text-2xl font-bold text-rose-600">{getPriorityStatistics.high.total}</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Completed:</span>
                <span className="font-semibold text-slate-900">{getPriorityStatistics.high.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">In progress:</span>
                <span className="font-semibold text-slate-900">{getPriorityStatistics.high.inProgress}</span>
              </div>
              {getPriorityStatistics.high.overdue > 0 && (
                <div className="flex justify-between">
                  <span className="text-rose-600">Overdue:</span>
                  <span className="font-semibold text-rose-600">{getPriorityStatistics.high.overdue}</span>
                </div>
              )}
              {getPriorityStatistics.high.total > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Completion:</span>
                    <span className="font-semibold text-slate-900">
                      {Math.round((getPriorityStatistics.high.completed / getPriorityStatistics.high.total) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medium Priority Card */}
          <div className="bg-white border p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 flex items-center justify-center bg-amber-50 border border-amber-100">
                <Flag className="h-5 w-5 text-amber-600" />
              </span>
              <div>
                <div className="text-slate-600 text-xs uppercase font-semibold">Medium Priority</div>
                <div className="text-2xl font-bold text-amber-600">{getPriorityStatistics.medium.total}</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Completed:</span>
                <span className="font-semibold text-slate-900">{getPriorityStatistics.medium.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">In progress:</span>
                <span className="font-semibold text-slate-900">{getPriorityStatistics.medium.inProgress}</span>
              </div>
              {getPriorityStatistics.medium.overdue > 0 && (
                <div className="flex justify-between">
                  <span className="text-rose-600">Overdue:</span>
                  <span className="font-semibold text-rose-600">{getPriorityStatistics.medium.overdue}</span>
                </div>
              )}
              {getPriorityStatistics.medium.total > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Completion:</span>
                    <span className="font-semibold text-slate-900">
                      {Math.round((getPriorityStatistics.medium.completed / getPriorityStatistics.medium.total) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Low Priority Card */}
          <div className="bg-white border p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 flex items-center justify-center bg-emerald-50 border border-emerald-100">
                <Flag className="h-5 w-5 text-emerald-600" />
              </span>
              <div>
                <div className="text-slate-600 text-xs uppercase font-semibold">Low Priority</div>
                <div className="text-2xl font-bold text-emerald-600">{getPriorityStatistics.low.total}</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Completed:</span>
                <span className="font-semibold text-slate-900">{getPriorityStatistics.low.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">In progress:</span>
                <span className="font-semibold text-slate-900">{getPriorityStatistics.low.inProgress}</span>
              </div>
              {getPriorityStatistics.low.overdue > 0 && (
                <div className="flex justify-between">
                  <span className="text-rose-600">Overdue:</span>
                  <span className="font-semibold text-rose-600">{getPriorityStatistics.low.overdue}</span>
                </div>
              )}
              {getPriorityStatistics.low.total > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Completion:</span>
                    <span className="font-semibold text-slate-900">
                      {Math.round((getPriorityStatistics.low.completed / getPriorityStatistics.low.total) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unassigned Priority Card */}
          <div className="bg-white border p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100">
                <Layers className="h-5 w-5 text-slate-600" />
              </span>
              <div>
                <div className="text-slate-600 text-xs uppercase font-semibold">Unassigned</div>
                <div className="text-2xl font-bold text-slate-600">{getPriorityStatistics.unassigned.total}</div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Completed:</span>
                <span className="font-semibold text-slate-900">{getPriorityStatistics.unassigned.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">In progress:</span>
                <span className="font-semibold text-slate-900">{getPriorityStatistics.unassigned.inProgress}</span>
              </div>
              {getPriorityStatistics.unassigned.overdue > 0 && (
                <div className="flex justify-between">
                  <span className="text-rose-600">Overdue:</span>
                  <span className="font-semibold text-rose-600">{getPriorityStatistics.unassigned.overdue}</span>
                </div>
              )}
              {getPriorityStatistics.unassigned.total > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Completion:</span>
                    <span className="font-semibold text-slate-900">
                      {Math.round((getPriorityStatistics.unassigned.completed / getPriorityStatistics.unassigned.total) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="bg-white border p-4 shadow-sm xl:col-span-2">
          <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Work trend
          </h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 h-72">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <p className="text-slate-500">Loading chart...</p>
            </div>
          ) : !Array.isArray(chartData) || chartData.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center">
              <p className="text-slate-700 font-medium">No data to display</p>
              <span className="text-slate-500 text-sm">{!selectedBoardId ? "Please select a board" : "Analytics API is not ready. Backend needs to implement analytics endpoints."}</span>
            </div>
          ) : (
            <div className="relative h-96">
              <Line data={prepareChartData()} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Pie Chart - Task Distribution */}
        <div className="bg-white border p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-600" />
            Task distribution
          </h3>
          {loading || stats.totalTasks === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-500">No data</div>
          ) : (
            <div className="relative h-80">
              <Doughnut
                data={preparePieChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        padding: 15,
                        font: { size: 12 },
                        usePointStyle: true,
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.label || "";
                          const value = context.parsed || 0;
                          const total = stats.totalTasks;
                          const percentage = total > 0 ? Math.round((Number(value) / Number(total)) * 100) : 0;
                          return `${label}: ${value} (${percentage}%)`;
                        },
                      },
                    },
                  },
                }}
                plugins={[doughnutPercentPlugin]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Column Distribution & Priority Charts */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Column Distribution Bar Chart */}
        <div className="bg-white border p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Columns className="h-4 w-4 text-blue-600" />
            Column Distribution
          </h3>
          {loading || !getColumnDistribution.length ? (
            <div className="h-72 flex items-center justify-center text-slate-500">
              {loading ? "Loading..." : "No column data available"}
            </div>
          ) : (
            <div className="relative h-80">
              <Bar
                data={prepareColumnChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top" as const,
                      labels: {
                        font: {
                          size: 12,
                          weight: 600,
                        },
                        padding: 15,
                        usePointStyle: true,
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context: any) {
                          const label = context.dataset.label || "";
                          const value = context.parsed.y || 0;
                          return `${label}: ${value}`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        font: {
                          size: 11,
                        },
                      },
                      grid: {
                        color: "rgba(0, 0, 0, 0.05)",
                      },
                    },
                    x: {
                      ticks: {
                        font: {
                          size: 11,
                        },
                        maxRotation: 45,
                        minRotation: 0,
                      },
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Priority Statistics Bar Chart */}
        <div className="bg-white border p-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Flag className="h-4 w-4 text-rose-600" />
            Priority Distribution
          </h3>
          {loading || stats.totalTasks === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-500">
              {loading ? "Loading..." : "No priority data available"}
            </div>
          ) : (
            <div className="relative h-80">
              <Bar
                data={preparePriorityChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top" as const,
                      labels: {
                        font: {
                          size: 12,
                          weight: 600,
                        },
                        padding: 15,
                        usePointStyle: true,
                      },
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context: any) {
                          const label = context.dataset.label || "";
                          const value = context.parsed.y || 0;
                          return `${label}: ${value}`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                        font: {
                          size: 11,
                        },
                      },
                      grid: {
                        color: "rgba(0, 0, 0, 0.05)",
                      },
                    },
                    x: {
                      ticks: {
                        font: {
                          size: 11,
                        },
                      },
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Team Performance - Top Contributors */}
      {getTeamPerformance.length > 0 && (
        <div className="bg-white border p-4 shadow-sm mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-slate-700" />
              Top 5 Contributors
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-1 border border-amber-100">
              <TrendingUp className="h-3.5 w-3.5" /> Leaderboard
            </span>
          </div>
          <div className="w-full">
            <div className="text-xs font-semibold text-slate-500 grid grid-cols-[48px_1fr_120px_220px_60px] gap-x-6 px-2 py-2 border-b border-slate-100">
              <div>Rank</div>
              <div>User</div>
              <div className="text-center">Completed</div>
              <div>Progress</div>
              <div className="text-right">%</div>
            </div>
            <div className="divide-y divide-slate-100">
              {getTeamPerformance.map((user, index) => {
                const rank = index + 1;
                const initials = (user.name || '').trim().charAt(0).toUpperCase() || '?';
                return (
                  <div key={user.userId} className="grid grid-cols-[48px_1fr_120px_220px_60px] gap-x-6 items-center px-2 py-3 hover:bg-slate-50 transition">
                    <div className="text-slate-700 font-semibold tabular-nums">#{rank}</div>
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-200 text-slate-700 font-semibold flex items-center justify-center text-xs">{initials}</div>
                      <span className="truncate font-medium text-slate-900">{user.name}</span>
                    </div>
                    <div className="text-center text-slate-600 tabular-nums">{user.completed}/{user.total}</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-200 overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${user.completionRate}%` }}></div>
                      </div>
                    </div>
                    <div className="text-right font-semibold text-slate-900 tabular-nums">{user.completionRate}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-[1060] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setExportModalOpen(false)}>
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 flex items-center justify-between">
              <h3 className="text-white text-lg font-bold">Export report</h3>
              <button className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50" onClick={() => setExportModalOpen(false)} aria-label="Close export modal">
                <XIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">File name</label>
                <input
                  type="text"
                  value={exportFilename}
                  onChange={(e) => setExportFilename(e.target.value)}
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  placeholder="e.g., boardA_report_2025-11-10"
                />
                <p className="text-xs text-slate-500 mt-1">No need to add extension - .csv/.json will be added automatically.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-700">Export types</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={exportSelections.csv} onChange={(e) => setExportSelections((s) => ({ ...s, csv: e.target.checked }))} className="w-4 h-4" />
                      <span>CSV (tasks)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={exportSelections.json} onChange={(e) => setExportSelections((s) => ({ ...s, json: e.target.checked }))} className="w-4 h-4" />
                      <span>JSON (full report)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-700">Options</div>
                  <div className="mt-2 flex flex-col gap-2 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={exportOptions.includeHeaders} onChange={(e) => setExportOptions((o) => ({ ...o, includeHeaders: e.target.checked }))} className="w-4 h-4" />
                      <span>Include CSV headers</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={exportOptions.includeChartData} onChange={(e) => setExportOptions((o) => ({ ...o, includeChartData: e.target.checked }))} className="w-4 h-4" />
                      <span>Include chart data in JSON</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={exportOptions.includeTeamPerformance} onChange={(e) => setExportOptions((o) => ({ ...o, includeTeamPerformance: e.target.checked }))} className="w-4 h-4" />
                      <span>Include team performance in JSON</span>
                    </label>
                    <label className="inline-flex items-center gap-2 mt-1">
                      <input type="checkbox" checked={exportOptions.filterByRange} onChange={(e) => setExportOptions((o) => ({ ...o, filterByRange: e.target.checked }))} className="w-4 h-4" />
                      <span>Only include tasks within selected date range</span>
                    </label>
                    {exportOptions.filterByRange && (
                      <div className="mt-2">
                        <label className="block text-xs text-slate-600 mb-1">Date field to filter by</label>
                        <select value={exportOptions.dateField} onChange={(e) => setExportOptions((o) => ({ ...o, dateField: e.target.value }))} className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm">
                          <option value="created_at">Created date</option>
                          <option value="start_date">Start date</option>
                          <option value="due_date">Due date</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-slate-600">
                <div><span className="font-medium">Board:</span> {boards.find((b) => (b._id || b.id) === selectedBoardId)?.title || 'All'}</div>
                <div className="mt-1"><span className="font-medium">Range:</span> {dateRange.start} → {dateRange.end} • <span className="font-medium">Granularity:</span> {granularity}</div>
              </div>

              {exportOptions.filterByRange && (
                <div className="p-4 bg-slate-50 rounded border border-slate-100">
                  <div className="text-sm font-medium text-slate-700 mb-2">Export date range</div>
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-600">From</label>
                      <input type="date" value={exportDateRange.start} onChange={(e) => setExportDateRange((r) => ({ ...r, start: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-600">To</label>
                      <input type="date" value={exportDateRange.end} onChange={(e) => setExportDateRange((r) => ({ ...r, end: e.target.value }))} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-2">
              <button onClick={() => setExportModalOpen(false)} className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700">Cancel</button>
              <button onClick={performExports} className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700">Export</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2" onClick={() => setShowTaskModal(false)}>
          <div className="w-full max-w-3xl max-h-[80vh] overflow-hidden bg-white shadow-2xl flex flex-col" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20">
                  {modalTaskType === 'total' && <ClipboardList className="h-4 w-4 text-white" />}
                  {modalTaskType === 'completed' && <CheckCircle2 className="h-4 w-4 text-white" />}
                  {modalTaskType === 'inProgress' && <Timer className="h-4 w-4 text-white" />}
                  {modalTaskType === 'overdue' && <AlertTriangle className="h-4 w-4 text-white" />}
                </span>
                <h2 className="text-white text-base font-bold">
                  {modalTaskType === 'total' && 'All tasks'}
                  {modalTaskType === 'completed' && 'Completed tasks'}
                  {modalTaskType === 'inProgress' && 'In progress tasks'}
                  {modalTaskType === 'overdue' && 'Overdue tasks'}
                  <span className="ml-2 text-white/90 font-medium">({getModalTaskCount()})</span>
                </h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setShowTaskModal(false)} className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2.5 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  placeholder="Search tasks..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4">
              {getFilteredTasks().length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-slate-700 font-medium">No tasks found</p>
                  <span className="text-slate-500 text-sm">{taskSearchQuery ? 'Try searching with a different keyword' : 'No tasks in this category yet'}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {getFilteredTasks().map((task, index) => {
                    const taskId = task._id || task.id;
                    const assignedUser = task.assigned_to;
                    const assignedName =
                      assignedUser?.full_name ||
                      assignedUser?.username ||
                      "Unassigned";
                    const dueDate = task.due_date
                      ? new Date(task.due_date).toLocaleDateString("en-US")
                      : "No due date";
                    const isOverdue =
                      task.due_date && new Date(task.due_date) < new Date();
                    const columnName = task.column_id?.name || "Unclassified";
                    const priority = task.priority || "Medium";

                    return (
                      <div key={taskId || index} className="border border-slate-200 p-4 bg-white">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-slate-900 flex-1 min-w-0 truncate break-all">{task.title || 'Untitled Task'}</h3>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${priority.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200' : priority.toLowerCase() === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{priority}</span>
                        </div>

                        {task.description && (
                          <p className="text-slate-600 mt-2">{task.description}</p>
                        )}

                        <div className="mt-3 space-y-1.5 text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="text-slate-600"><span className="text-slate-500">📍 Column:</span> <span className="font-medium text-slate-800">{columnName}</span></div>
                            <div className="text-slate-600"><span className="text-slate-500">👤 Assignee:</span> <span className="font-medium text-slate-800">{assignedName}</span></div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="text-slate-600"><span className="text-slate-500">📅 Due date:</span> <span className={`font-medium ${isOverdue ? 'text-rose-600' : 'text-slate-800'}`}>{dueDate}</span></div>
                            {task.estimate_hours && (
                              <div className="text-slate-600"><span className="text-slate-500">⏱️ Estimate:</span> <span className="font-medium text-slate-800">{task.estimate_hours}h</span></div>
                            )}
                          </div>
                        </div>

                        {task.tag && (
                          <div className="mt-3">
                            <span className="inline-flex items-center text-xs font-medium text-white px-2 py-1 rounded" style={{ background: task.tag.color || '#667eea' }}>{task.tag.name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button onClick={() => setShowTaskModal(false)} className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
