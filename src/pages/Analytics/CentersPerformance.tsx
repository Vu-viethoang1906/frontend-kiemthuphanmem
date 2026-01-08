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
import { Bar, Doughnut } from "react-chartjs-2";
import { compareCentersPerformance } from "../../api/analyticsApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  AlertCircle,
  BarChart3,
  Activity,
  Zap,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  MapPin,
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

interface CenterData {
  center_id: string;
  center_name: string;
  center_status: string;
  center_address?: string;
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  completionRate: number;
  averageCompletionRatePerUser: number;
  totalPoints: number;
  averagePointsPerUser: number;
  activeDays: number;
  averageActiveDaysPerUser: number;
  tasksCreated: number;
  tasksCompleted: number;
  averageTasksCreatedPerUser: number;
  averageTasksCompletedPerUser: number;
}

interface CentersPerformanceData {
  summary: {
    totalCenters: number;
    totalUsers: number;
    totalActiveUsers: number;
    totalTasks: number;
    totalCompletedTasks: number;
    overallCompletionRate: number;
  };
  centers: CenterData[];
  rankings: {
    byCompletionRate: Array<{
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    }>;
    byTotalTasks: Array<{
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    }>;
    byActiveUsers: Array<{
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    }>;
    byAveragePoints: Array<{
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    }>;
    byEngagement: Array<{
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    }>;
  };
  insights: {
    topPerformer: {
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    } | null;
    mostActive: {
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    } | null;
    mostEngaged: {
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    } | null;
    needsSupport: {
      rank: number;
      center_id: string;
      center_name: string;
      value: number;
    } | null;
  };
}

const CentersPerformance: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<CentersPerformanceData | null>(null);

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

  // Load centers performance data
  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        setDataLoading(true);
        const params: any = {};
        if (selectedBoardId) {
          params.board_id = selectedBoardId;
        }

        const response = await compareCentersPerformance(params);

        if (response?.success && response?.data) {
          setPerformanceData(response.data);
        } else {
          toast.error("Failed to load centers performance data");
        }
      } catch (error: any) {
        console.error("Error loading centers performance data:", error);
        toast.error(error?.response?.data?.message || "Failed to load centers performance data");
      } finally {
        setDataLoading(false);
      }
    };

    loadPerformanceData();
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

  // Prepare completion rate comparison chart
  const getCompletionRateChartData = () => {
    if (!performanceData?.centers || performanceData.centers.length === 0) return null;

    const centers = performanceData.centers;
    const labels = centers.map((c) => c.center_name);
    const completionRates = centers.map((c) => c.completionRate);

    return {
      labels,
      datasets: [
        {
          label: "Completion Rate (%)",
          data: completionRates,
          backgroundColor: centers.map((c, i) => {
            const rank = performanceData.rankings.byCompletionRate.findIndex(
              (r) => r.center_id === c.center_id
            );
            if (rank === 0) return "rgba(34, 197, 94, 0.7)"; // Green for top
            if (rank === centers.length - 1) return "rgba(239, 68, 68, 0.7)"; // Red for bottom
            return "rgba(59, 130, 246, 0.7)"; // Blue for middle
          }),
          borderColor: centers.map((c, i) => {
            const rank = performanceData.rankings.byCompletionRate.findIndex(
              (r) => r.center_id === c.center_id
            );
            if (rank === 0) return "rgba(34, 197, 94, 1)";
            if (rank === centers.length - 1) return "rgba(239, 68, 68, 1)";
            return "rgba(59, 130, 246, 1)";
          }),
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare tasks comparison chart
  const getTasksComparisonChartData = () => {
    if (!performanceData?.centers || performanceData.centers.length === 0) return null;

    const centers = performanceData.centers;
    const labels = centers.map((c) => c.center_name);

    return {
      labels,
      datasets: [
        {
          label: "Completed",
          data: centers.map((c) => c.completedTasks),
          backgroundColor: "rgba(34, 197, 94, 0.7)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 2,
        },
        {
          label: "In Progress",
          data: centers.map((c) => c.inProgressTasks),
          backgroundColor: "rgba(245, 158, 11, 0.7)",
          borderColor: "rgba(245, 158, 11, 1)",
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare users comparison chart
  const getUsersComparisonChartData = () => {
    if (!performanceData?.centers || performanceData.centers.length === 0) return null;

    const centers = performanceData.centers;
    const labels = centers.map((c) => c.center_name);

    return {
      labels,
      datasets: [
        {
          label: "Total Users",
          data: centers.map((c) => c.totalUsers),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
        },
        {
          label: "Active Users",
          data: centers.map((c) => c.activeUsers),
          backgroundColor: "rgba(168, 85, 247, 0.7)",
          borderColor: "rgba(168, 85, 247, 1)",
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare points comparison chart
  const getPointsChartData = () => {
    if (!performanceData?.centers || performanceData.centers.length === 0) return null;

    const centers = performanceData.centers;
    const labels = centers.map((c) => c.center_name);
    const avgPoints = centers.map((c) => c.averagePointsPerUser);

    return {
      labels,
      datasets: [
        {
          label: "Average Points Per User",
          data: avgPoints,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-slate-900">
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
                <Building2 className="w-8 h-8 text-indigo-600" />
                Centers Performance Comparison
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Compare center performance to guide resource allocation
              </p>
            </div>
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30">
              <Trophy className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-slate-800 p-4 border-l-4 border-blue-600 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter by Board (Optional):
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => handleBoardChange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={dataLoading}
            >
              <option value="">All Boards</option>
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
        ) : !performanceData ? (
          <div className="bg-white dark:bg-slate-800 p-12 text-center border-l-4 border-gray-400 border border-gray-200 dark:border-slate-700">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No data available. Please ensure there are active centers.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards - 4 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px]">
              <div className="bg-white dark:bg-slate-800 p-6 border-l-4 border-blue-500 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Centers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {performanceData.summary.totalCenters}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {performanceData.summary.totalUsers}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {performanceData.summary.totalActiveUsers} active
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {performanceData.summary.totalTasks}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {performanceData.summary.totalCompletedTasks} completed
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 border-l-4 border-indigo-500 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Overall Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {performanceData.summary.overallCompletionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Insights Cards - 4 Column Grid */}
            {performanceData.insights && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px]">
                {/* Top Performer */}
                {performanceData.insights.topPerformer && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border-l-4 border-green-500 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30">
                        <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Top Performer</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Highest Completion Rate</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {performanceData.insights.topPerformer.center_name}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      {performanceData.insights.topPerformer.value.toFixed(1)}%
                    </p>
                  </div>
                )}

                {/* Most Active */}
                {performanceData.insights.mostActive && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 border-l-4 border-blue-500 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30">
                        <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Most Active</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Most Active Users</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {performanceData.insights.mostActive.center_name}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                      {performanceData.insights.mostActive.value} users
                    </p>
                  </div>
                )}

                {/* Most Engaged */}
                {performanceData.insights.mostEngaged && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 border-l-4 border-purple-500 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30">
                        <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Most Engaged</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Highest Engagement</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {performanceData.insights.mostEngaged.center_name}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                      {performanceData.insights.mostEngaged.value.toFixed(1)} days
                    </p>
                  </div>
                )}

                {/* Needs Support */}
                {performanceData.insights.needsSupport && (
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-6 border-l-4 border-red-500 border border-gray-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30">
                        <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Needs Support</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-500">Lowest Completion Rate</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {performanceData.insights.needsSupport.center_name}
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                      {performanceData.insights.needsSupport.value.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Charts Grid - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Completion Rate Comparison */}
              {getCompletionRateChartData() && (
                <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30">
                      <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Completion Rate Comparison
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Compare completion rates across centers
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={getCompletionRateChartData()!}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: function (value) {
                                return value + "%";
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tasks Comparison */}
              {getTasksComparisonChartData() && (
                <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30">
                      <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Tasks Comparison
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Completed vs In Progress tasks
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={getTasksComparisonChartData()!}
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
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Users & Points Charts - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Users Comparison */}
              {getUsersComparisonChartData() && (
                <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-purple-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30">
                      <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Users Comparison
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total vs Active users
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={getUsersComparisonChartData()!}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Points Comparison */}
              {getPointsChartData() && (
                <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-amber-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30">
                      <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Average Points Per User
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Gamification points comparison
                      </p>
                    </div>
                  </div>
                  <div className="h-64">
                    <Bar
                      data={getPointsChartData()!}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rankings Tables - 2 Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Completion Rate Ranking */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30">
                    <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Ranking by Completion Rate
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Top performing centers
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                        <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Rank
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Center
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.rankings.byCompletionRate.map((ranking) => (
                        <tr
                          key={ranking.center_id}
                          className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                            ranking.rank === 1 ? "bg-green-50 dark:bg-green-900/10" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`font-bold ${
                                ranking.rank === 1
                                  ? "text-green-600 dark:text-green-400"
                                  : ranking.rank === 2
                                  ? "text-blue-600 dark:text-blue-400"
                                  : ranking.rank === 3
                                  ? "text-purple-600 dark:text-purple-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              #{ranking.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {ranking.center_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {ranking.value.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Users Ranking */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Ranking by Active Users
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Centers with most active users
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                        <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Rank
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                          Center
                        </th>
                        <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                          Users
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.rankings.byActiveUsers.map((ranking) => (
                        <tr
                          key={ranking.center_id}
                          className={`border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                            ranking.rank === 1 ? "bg-blue-50 dark:bg-blue-900/10" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`font-bold ${
                                ranking.rank === 1
                                  ? "text-blue-600 dark:text-blue-400"
                                  : ranking.rank === 2
                                  ? "text-green-600 dark:text-green-400"
                                  : ranking.rank === 3
                                  ? "text-purple-600 dark:text-purple-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              #{ranking.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {ranking.center_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {ranking.value}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Detailed Centers Table */}
            <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border-l-4 border-indigo-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30">
                  <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Detailed Performance Metrics
                  </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detailed metrics for each center
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-slate-700">
                      <th className="py-3 px-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300">
                        Center
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Users
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Tasks
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Completion
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Points
                      </th>
                      <th className="py-3 px-4 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                        Engagement
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.centers.map((center) => {
                      const completionRank = performanceData.rankings.byCompletionRate.findIndex(
                        (r) => r.center_id === center.center_id
                      ) + 1;
                      return (
                        <tr
                          key={center.center_id}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {center.center_name}
                              </span>
                              {center.center_address && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {center.center_address}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {center.totalUsers}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {center.activeUsers} active
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {center.totalTasks}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {center.completedTasks} done
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div>
                              <span
                                className={`font-bold ${
                                  completionRank === 1
                                    ? "text-green-600 dark:text-green-400"
                                    : completionRank === performanceData.centers.length
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {center.completionRate.toFixed(1)}%
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Rank #{completionRank}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {center.totalPoints.toLocaleString()}
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Avg: {center.averagePointsPerUser.toFixed(1)}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {center.averageActiveDaysPerUser.toFixed(1)} days
                              </span>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Total: {center.activeDays}
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

export default CentersPerformance;

