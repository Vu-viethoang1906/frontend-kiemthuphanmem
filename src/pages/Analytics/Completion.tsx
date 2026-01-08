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
import { Line, Bar } from "react-chartjs-2";
import { getCompletionSpeed } from "../../api/analyticsApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  BarChart3,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
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

interface WeeklyData {
  weekNumber: number;
  week: string;
  start: string;
  end: string;
  completedTasks: number;
  priorityBreakdown: {
    High: number;
    Medium: number;
    Low: number;
    None: number;
  };
}

interface CompletionSpeedData {
  board: {
    id: string;
    title: string;
  };
  dateRange: {
    start: string;
    end: string;
  };
  weeklyData: WeeklyData[];
  averageVelocity: number;
  trend: {
    slope: number;
    intercept: number;
    direction: "increasing" | "decreasing" | "stable";
  } | null;
  previousPeriodComparison: {
    previousPeriod: {
      average: number;
      total: number;
      weeks: number;
    };
    currentPeriod: {
      average: number;
      total: number;
      weeks: number;
    };
    difference: number;
    percentageChange: number;
    direction: "increasing" | "decreasing" | "stable";
  } | null;
  priorityBreakdown: {
    total: {
      High: number;
      Medium: number;
      Low: number;
      None: number;
    };
    percentages: {
      High: number;
      Medium: number;
      Low: number;
      None: number;
    };
  } | null;
  forecast: {
    nextWeek: number;
    next2Weeks: number;
    next4Weeks: number;
    confidence: "low" | "medium" | "high";
  } | null;
}

const Completion: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionSpeedData | null>(null);
  const [hasError, setHasError] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

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

  // Load completion speed data
  useEffect(() => {
    const loadCompletionData = async () => {
      if (!selectedBoardId || !dateRange.start || !dateRange.end) return;

      try {
        setHasError(false);
        setDataLoading(true);
        const response = await getCompletionSpeed({
          board_id: selectedBoardId,
          start_date: dateRange.start,
          end_date: dateRange.end,
        });

        if (response?.success && response?.data) {
          setCompletionData(response.data);
        } else {
          toast.error("Failed to load completion speed data");
          setHasError(true);
          setCompletionData(null);
        }
      } catch (error: any) {
        console.error("Error loading completion speed data:", error);
        toast.error(error?.response?.data?.message || "Failed to load completion speed data");
        setHasError(true);
        setCompletionData(null);
      } finally {
        setDataLoading(false);
      }
    };

    loadCompletionData();
  }, [selectedBoardId, dateRange.start, dateRange.end]);

  const updateURL = (boardId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("board", boardId);
    setSearchParams(newParams);
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    updateURL(boardId);
  };

  // Prepare velocity chart data
  const getVelocityChartData = () => {
    if (!completionData?.weeklyData || completionData.weeklyData.length === 0) return null;

    const labels = completionData.weeklyData.map((w) => w.week);
    const completedTasks = completionData.weeklyData.map((w) => w.completedTasks);

    return {
      labels,
      datasets: [
        {
          label: "Tasks Completed",
          data: completedTasks,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "rgb(59, 130, 246)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    };
  };

  // Prepare priority breakdown chart data
  const getPriorityChartData = () => {
    if (!completionData?.priorityBreakdown) return null;

    const { total, percentages } = completionData.priorityBreakdown;

    return {
      labels: ["High", "Medium", "Low", "None"],
      datasets: [
        {
          label: "Tasks by Priority",
          data: [total.High, total.Medium, total.Low, total.None],
          backgroundColor: [
            "rgba(239, 68, 68, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(34, 197, 94, 0.8)",
            "rgba(156, 163, 175, 0.8)",
          ],
          borderColor: [
            "rgba(239, 68, 68, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(34, 197, 94, 1)",
            "rgba(156, 163, 175, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare weekly priority breakdown chart
  const getWeeklyPriorityChartData = () => {
    if (!completionData?.weeklyData || completionData.weeklyData.length === 0) return null;

    const labels = completionData.weeklyData.map((w) => w.week);
    const high = completionData.weeklyData.map((w) => w.priorityBreakdown.High);
    const medium = completionData.weeklyData.map((w) => w.priorityBreakdown.Medium);
    const low = completionData.weeklyData.map((w) => w.priorityBreakdown.Low);
    const none = completionData.weeklyData.map((w) => w.priorityBreakdown.None);

    return {
      labels,
      datasets: [
        {
          label: "High",
          data: high,
          backgroundColor: "rgba(239, 68, 68, 0.7)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 1,
        },
        {
          label: "Medium",
          data: medium,
          backgroundColor: "rgba(245, 158, 11, 0.7)",
          borderColor: "rgba(245, 158, 11, 1)",
          borderWidth: 1,
        },
        {
          label: "Low",
          data: low,
          backgroundColor: "rgba(34, 197, 94, 0.7)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
        },
        {
          label: "None",
          data: none,
          backgroundColor: "rgba(156, 163, 175, 0.7)",
          borderColor: "rgba(156, 163, 175, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-6">
      <div className="space-y-[2px]">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Completion Speed Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track weekly completion speed to assess productivity and forecast
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 ">
              <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Select Board
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => handleBoardChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600  bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                disabled={dataLoading}
              >
                {boards.map((board) => (
                  <option key={board._id || board.id} value={board._id || board.id}>
                    {board.title || board.name || "Untitled Board"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, start: e.target.value }))
                }
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600  bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                disabled={dataLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-slate-600  bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                disabled={dataLoading}
              />
            </div>
          </div>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        ) : !completionData ? (
          <div className="bg-white dark:bg-slate-800 p-12 text-center border border-gray-200 dark:border-slate-700">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {hasError || boards.length === 0
                ? "No data available. Please try again later."
                : "No results yet. Please select a board with completed tasks."}
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-[2px]">
              {/* Average Velocity */}
              <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Average Velocity</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{completionData.averageVelocity.toFixed(1)}</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">tasks/week</p>
              </div>

              {/* Trend */}
              {completionData.trend && (
                <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 flex items-center justify-center ${
                      completionData.trend.direction === "increasing"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : completionData.trend.direction === "decreasing"
                        ? "bg-red-100 dark:bg-red-900/30"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      {completionData.trend.direction === "increasing" ? (
                        <TrendingUp className={`w-6 h-6 ${
                          completionData.trend.direction === "increasing"
                            ? "text-green-600 dark:text-green-400"
                            : ""
                        }`} />
                      ) : completionData.trend.direction === "decreasing" ? (
                        <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                      ) : (
                        <Minus className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Trend</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                    {completionData.trend.direction}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                    Slope: {completionData.trend.slope > 0 ? "+" : ""}
                    {completionData.trend.slope.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Previous Period Comparison */}
              {completionData.previousPeriodComparison && (
                <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      {completionData.previousPeriodComparison.direction === "increasing" ? (
                        <ArrowUpRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <ArrowDownRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Period Change</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {completionData.previousPeriodComparison.percentageChange > 0 ? "+" : ""}
                    {completionData.previousPeriodComparison.percentageChange.toFixed(1)}%
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                    {completionData.previousPeriodComparison.direction === "increasing"
                      ? "Improved"
                      : "Declined"}
                  </p>
                </div>
              )}

              {/* Total Completed */}
              <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Completed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {completionData.weeklyData.reduce(
                    (sum, week) => sum + week.completedTasks,
                    0
                  )}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {completionData.weeklyData.length} weeks
                </p>
              </div>
            </div>

            {/* Velocity Chart */}
            {getVelocityChartData() && (
              <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 ">
                    <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Velocity Chart
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Number of tasks completed per week
                    </p>
                  </div>
                </div>
                <div className="h-80">
                  <Line
                    data={getVelocityChartData()!}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          backgroundColor: "rgba(0, 0, 0, 0.8)",
                          padding: 12,
                          titleFont: { size: 14, weight: "bold" },
                          bodyFont: { size: 13 },
                          cornerRadius: 8,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: "rgba(0, 0, 0, 0.05)",
                          },
                          ticks: {
                            precision: 0,
                          },
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Grid: Priority Breakdown & Weekly Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px]">
              {/* Priority Breakdown */}
              {getPriorityChartData() && (
                <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 ">
                      <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Priority Breakdown
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Distribution of tasks by priority
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
                            display: false,
                          },
                        },
                      }}
                    />
                  </div>
                  {completionData.priorityBreakdown && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {Object.entries(completionData.priorityBreakdown.percentages).map(
                        ([priority, pct]) => {
                          const priorityBreakdown = completionData.priorityBreakdown;
                          if (!priorityBreakdown) return null;
                          
                          return (
                            <div
                              key={priority}
                              className="text-center p-3 bg-gray-50 dark:bg-slate-700/50 "
                            >
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {priority}
                              </p>
                              <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {pct.toFixed(1)}%
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {priorityBreakdown.total[priority as keyof typeof priorityBreakdown.total]} tasks
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Weekly Priority Breakdown */}
              {getWeeklyPriorityChartData() && (
                <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 ">
                      <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Weekly Priority Breakdown
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Priority distribution by week
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={getWeeklyPriorityChartData()!}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          x: {
                            stacked: true,
                          },
                          y: {
                            stacked: true,
                            beginAtZero: true,
                          },
                        },
                        plugins: {
                          legend: {
                            position: "bottom",
                            labels: {
                              usePointStyle: true,
                              padding: 15,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Forecast & Comparison */}
            {(completionData.forecast || completionData.previousPeriodComparison) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px]">
                {/* Forecast */}
                {completionData.forecast && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 ">
                        <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Forecast
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Forecast of tasks to be completed
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 ">
                        <span className="text-gray-700 dark:text-gray-300">Next Week</span>
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {completionData.forecast.nextWeek}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 ">
                        <span className="text-gray-700 dark:text-gray-300">Next 2 Weeks</span>
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {completionData.forecast.next2Weeks}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 ">
                        <span className="text-gray-700 dark:text-gray-300">Next 4 Weeks</span>
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {completionData.forecast.next4Weeks}
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 ">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Confidence:{" "}
                          <span className="font-semibold capitalize">
                            {completionData.forecast.confidence}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Period Comparison */}
                {completionData.previousPeriodComparison && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 ">
                        <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Period Comparison
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          So sánh với kỳ trước
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white dark:bg-slate-800 ">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Previous Period
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {completionData.previousPeriodComparison.previousPeriod.average.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {completionData.previousPeriodComparison.previousPeriod.weeks} weeks
                          </p>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800 ">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Current Period
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {completionData.previousPeriodComparison.currentPeriod.average.toFixed(1)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {completionData.previousPeriodComparison.currentPeriod.weeks} weeks
                          </p>
                        </div>
                      </div>
                      <div
                        className={`p-4  ${
                          completionData.previousPeriodComparison.direction === "increasing"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-red-100 dark:bg-red-900/30"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Change
                          </span>
                          <span
                            className={`text-xl font-bold ${
                              completionData.previousPeriodComparison.direction === "increasing"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {completionData.previousPeriodComparison.difference > 0 ? "+" : ""}
                            {completionData.previousPeriodComparison.difference.toFixed(1)} tasks/week
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {completionData.previousPeriodComparison.percentageChange > 0 ? "+" : ""}
                          {completionData.previousPeriodComparison.percentageChange.toFixed(1)}%{" "}
                          {completionData.previousPeriodComparison.direction === "increasing"
                            ? "increase"
                            : "decrease"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Weekly Data Table */}
            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 ">
                  <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Weekly Data
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Details of tasks completed per week
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                      <th className="py-4 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                        Week
                      </th>
                      <th className="py-4 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                        Period
                      </th>
                      <th className="py-4 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Completed
                      </th>
                      <th className="py-4 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        High
                      </th>
                      <th className="py-4 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Medium
                      </th>
                      <th className="py-4 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Low
                      </th>
                      <th className="py-4 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        None
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {completionData.weeklyData.map((week, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {week.week}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(week.start).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          -{" "}
                          {new Date(week.end).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">
                            {week.completedTasks}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-red-600 dark:text-red-400 font-medium">
                          {week.priorityBreakdown.High}
                        </td>
                        <td className="py-4 px-4 text-right text-amber-600 dark:text-amber-400 font-medium">
                          {week.priorityBreakdown.Medium}
                        </td>
                        <td className="py-4 px-4 text-right text-green-600 dark:text-green-400 font-medium">
                          {week.priorityBreakdown.Low}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-500 dark:text-gray-400 font-medium">
                          {week.priorityBreakdown.None}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Completion;

