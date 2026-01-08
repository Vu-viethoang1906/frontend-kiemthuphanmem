import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { getCycleTime } from "../../api/analyticsApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Calendar,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

interface CycleTimeData {
  board: {
    id: string;
    title: string;
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    averageCycleTime: number;
    medianCycleTime: number;
    p90CycleTime: number;
    averageCycleTimeDays: number;
    medianCycleTimeDays: number;
    p90CycleTimeDays: number;
  };
  breakdown: {
    byPriority: {
      [key: string]: {
        count: number;
        average: number;
        median: number;
        p90: number;
      };
    };
    bySwimlane: {
      [key: string]: {
        count: number;
        average: number;
        median: number;
        p90: number;
      };
    };
  };
  outliers: Array<{
    task_id: string;
    title: string;
    assigned_to: {
      id: string;
      name: string;
    } | null;
    cycleTimeHours: number;
    cycleTimeDays: number;
    medianCycleTime: number;
    ratio: number;
  }>;
  columnMedians: {
    [key: string]: number;
  };
  tasks: Array<{
    task_id: string;
    title: string;
    assigned_to: {
      id: string;
      name: string;
      email: string;
    } | null;
    priority: string;
    swimlane: string;
    cycleTimeHours: number;
    cycleTimeDays: number;
    columnDurations: Array<{
      column: string;
      hours: number;
    }>;
    isOutlier: boolean;
  }>;
}

const CycleTime: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [cycleTimeData, setCycleTimeData] = useState<CycleTimeData | null>(null);

  // Load boards
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

        const boardIdFromUrl = searchParams.get("board");
        if (boardIdFromUrl && validBoards.some((b) => (b._id || b.id) === boardIdFromUrl)) {
          setSelectedBoardId(boardIdFromUrl);
        } else if (validBoards.length > 0) {
          const firstBoardId = validBoards[0]._id || validBoards[0].id;
          setSelectedBoardId(firstBoardId);
          updateURL(firstBoardId);
        }
      } catch (error) {
        toast.error("Failed to load board list");
      } finally {
        setLoading(false);
      }
    };
    loadBoards();
  }, []);

  // Load cycle time data
  useEffect(() => {
    const loadCycleTimeData = async () => {
      if (!selectedBoardId) return;

      try {
        setDataLoading(true);
        const response = await getCycleTime({
          idBoard: selectedBoardId,
        });

        if (response?.success && response?.data) {
          setCycleTimeData(response.data);
        } else {
          toast.error("Failed to load cycle time data");
        }
      } catch (error: any) {
        console.error("Error loading cycle time data:", error);
        toast.error(error?.response?.data?.message || "Failed to load cycle time data");
      } finally {
        setDataLoading(false);
      }
    };

    loadCycleTimeData();
  }, [selectedBoardId]);

  const updateURL = (boardId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("board", boardId);
    setSearchParams(newParams);
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    updateURL(boardId);
  };

  // Format hours to days and hours
  const formatHours = (hours: number): string => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days}d`;
    }
    return `${days}d ${remainingHours.toFixed(1)}h`;
  };

  // Prepare priority breakdown chart
  const getPriorityChartData = () => {
    if (!cycleTimeData?.breakdown?.byPriority) return null;

    const priorities = ["High", "Medium", "Low", "None"];
    const averages = priorities.map((p) => cycleTimeData.breakdown.byPriority[p]?.average || 0);
    const medians = priorities.map((p) => cycleTimeData.breakdown.byPriority[p]?.median || 0);

    return {
      labels: priorities,
      datasets: [
        {
          label: "Average (hours)",
          data: averages,
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
        },
        {
          label: "Median (hours)",
          data: medians,
          backgroundColor: "rgba(34, 197, 94, 0.7)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare swimlane breakdown chart
  const getSwimlaneChartData = () => {
    if (!cycleTimeData?.breakdown?.bySwimlane) return null;

    const swimlanes = Object.keys(cycleTimeData.breakdown.bySwimlane);
    const averages = swimlanes.map((s) => cycleTimeData.breakdown.bySwimlane[s]?.average || 0);

    return {
      labels: swimlanes,
      datasets: [
        {
          label: "Average Cycle Time (hours)",
          data: averages,
          backgroundColor: [
            "rgba(239, 68, 68, 0.7)",
            "rgba(245, 158, 11, 0.7)",
            "rgba(34, 197, 94, 0.7)",
            "rgba(59, 130, 246, 0.7)",
            "rgba(168, 85, 247, 0.7)",
          ],
          borderColor: [
            "rgba(239, 68, 68, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(34, 197, 94, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(168, 85, 247, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare cycle time distribution chart
  const getDistributionChartData = () => {
    if (!cycleTimeData?.tasks) return null;

    const completedTasks = cycleTimeData.tasks.filter((t) => t.cycleTimeHours > 0);
    const cycleTimes = completedTasks.map((t) => t.cycleTimeHours).sort((a, b) => a - b);

    // Create bins for histogram
    const max = Math.max(...cycleTimes);
    const binCount = 10;
    const binSize = max / binCount;
    const bins = Array(binCount).fill(0);
    const binLabels = [];

    for (let i = 0; i < binCount; i++) {
      binLabels.push(`${(i * binSize).toFixed(0)}-${((i + 1) * binSize).toFixed(0)}h`);
    }

    cycleTimes.forEach((time) => {
      const binIndex = Math.min(Math.floor(time / binSize), binCount - 1);
      bins[binIndex]++;
    });

    return {
      labels: binLabels,
      datasets: [
        {
          label: "Number of Tasks",
          data: bins,
          backgroundColor: "rgba(99, 102, 241, 0.7)",
          borderColor: "rgba(99, 102, 241, 1)",
          borderWidth: 2,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6">
      <div className="space-y-[2px]">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-6 border-l-4 border-indigo-600 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Clock className="w-8 h-8 text-indigo-600" />
                Cycle Time Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Analyze cycle time from task creation to completion
              </p>
            </div>
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30">
              <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-slate-800 p-4 border-l-4 border-blue-600 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Select Board:
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => handleBoardChange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={dataLoading}
            >
              {boards.map((board) => (
                <option key={board._id || board.id} value={board._id || board.id}>
                  {board.title || board.name || "Untitled Board"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        ) : !cycleTimeData ? (
          <div className="bg-white dark:bg-slate-800 p-12 text-center border-l-4 border-gray-400 border border-gray-200 dark:border-slate-700">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No data available. Please select a board with completed tasks.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards - 3 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px]">
              {/* Average Cycle Time */}
              <div className="bg-white dark:bg-slate-800 p-6 border-l-4 border-blue-500 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Average Cycle Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatHours(cycleTimeData.summary.averageCycleTime)}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {cycleTimeData.summary.averageCycleTimeDays.toFixed(2)} days
                </p>
              </div>

              {/* Median Cycle Time */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Median Cycle Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatHours(cycleTimeData.summary.medianCycleTime)}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {cycleTimeData.summary.medianCycleTimeDays.toFixed(2)} days
                </p>
              </div>

              {/* P90 Cycle Time */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">P90 Cycle Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatHours(cycleTimeData.summary.p90CycleTime)}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {cycleTimeData.summary.p90CycleTimeDays.toFixed(2)} days
                </p>
              </div>
            </div>

            {/* Stats Grid - 4 Column */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 border-l-4 border-gray-400 border border-gray-200 dark:border-slate-700">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cycleTimeData.summary.totalTasks}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 shadow-lg p-4 border-l-4 border-green-400">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Completed Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cycleTimeData.summary.completedTasks}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 shadow-lg p-4 border-l-4 border-blue-400">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cycleTimeData.summary.totalTasks > 0
                    ? ((cycleTimeData.summary.completedTasks / cycleTimeData.summary.totalTasks) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 shadow-lg p-4 border-l-4 border-red-400">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">Outliers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {cycleTimeData.outliers.length}
                </p>
              </div>
            </div>

            {/* Charts Grid - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px]">
              {/* Priority Breakdown */}
              {getPriorityChartData() && (
                <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-indigo-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30">
                      <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Cycle Time by Priority
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Compare average and median by priority
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={getPriorityChartData()!}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Swimlane Breakdown */}
              {getSwimlaneChartData() && (
                <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30">
                      <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Cycle Time by Swimlane
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Average cycle time by swimlane
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={getSwimlaneChartData()!}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Distribution Chart - Full Width */}
            {getDistributionChartData() && (
              <div className="bg-white dark:bg-slate-800 p-6 border-l-4 border-blue-500 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Cycle Time Distribution
                    </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                      Distribution of cycle times for tasks
                      </p>
                  </div>
                </div>
                <div className="h-80">
                  <Bar
                    data={getDistributionChartData()!}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Breakdown Tables - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px]">
              {/* Priority Breakdown Table */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Breakdown by Priority
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Detailed metrics by priority
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                        <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Priority
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Count
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Avg (h)
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Median (h)
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          P90 (h)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(cycleTimeData.breakdown.byPriority).map(([priority, data]) => (
                        <tr
                          key={priority}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-900 dark:text-white">{priority}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {data.count}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {data.average.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {data.median.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {data.p90.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Swimlane Breakdown Table */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30">
                    <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Breakdown by Swimlane
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Detailed metrics by swimlane
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                        <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Swimlane
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Count
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Avg (h)
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Median (h)
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          P90 (h)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(cycleTimeData.breakdown.bySwimlane).map(([swimlane, data]) => (
                        <tr
                          key={swimlane}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-900 dark:text-white">{swimlane}</span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {data.count}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {data.average.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {data.median.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                            {data.p90.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Outliers Section */}
            {cycleTimeData.outliers.length > 0 && (
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Outlier Tasks
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tasks with cycle time exceeding 2x median ({formatHours(cycleTimeData.summary.medianCycleTime)})
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                        <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Task
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Assigned To
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Cycle Time
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Ratio
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cycleTimeData.outliers.map((outlier) => (
                        <tr
                          key={outlier.task_id}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-900 dark:text-white" title={outlier.title}>
                              {outlier.title.length > 50 ? `${outlier.title.substring(0, 50)}...` : outlier.title}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {outlier.assigned_to?.name || "Unassigned"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-red-600 dark:text-red-400">
                              {formatHours(outlier.cycleTimeHours)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-red-600 dark:text-red-400">
                              {outlier.ratio.toFixed(2)}x
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All Tasks Table */}
            <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30">
                  <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    All Tasks
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cycle time details for all tasks
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                      <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                        Task
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                        Assigned To
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                        Priority
                      </th>
                      <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                        Swimlane
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Cycle Time
                      </th>
                      <th className="py-3 px-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycleTimeData.tasks.slice(0, 50).map((task) => (
                      <tr
                        key={task.task_id}
                        className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                          task.isOutlier ? "bg-red-50 dark:bg-red-900/10" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900 dark:text-white" title={task.title}>
                            {task.title.length > 40 ? `${task.title.substring(0, 40)}...` : task.title}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {task.assigned_to?.name || "Unassigned"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-semibold ${
                              task.priority === "High"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : task.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : task.priority === "Low"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {task.priority || "None"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {task.swimlane || "None"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {task.cycleTimeHours > 0 ? formatHours(task.cycleTimeHours) : "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {task.isOutlier ? (
                            <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              Outlier
                            </span>
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cycleTimeData.tasks.length > 50 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
                    Showing first 50 tasks of {cycleTimeData.tasks.length} total
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CycleTime;

