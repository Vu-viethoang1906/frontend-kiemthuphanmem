import React, { useState, useEffect } from "react";
import { getGamificationCorrelation } from "../../api/analyticsApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Users,
  BarChart3,
  Activity,
  Zap,
  CheckCircle2,
  XCircle,
  Minus,
  Sparkles,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

interface GamificationData {
  summary: {
    totalUsers: number;
    usersWithPoints: number;
    usersWithoutPoints: number;
    usersWithTasks: number;
  };
  completionRateComparison: {
    withPoints: {
      count: number;
      averageCompletionRate: number;
      medianCompletionRate: number;
    };
    withoutPoints: {
      count: number;
      averageCompletionRate: number;
      medianCompletionRate: number;
    };
    difference: number;
    percentageDifference: number;
  };
  correlation: {
    pearsonCoefficient: number | null;
    strength: string | null;
    interpretation: string;
  };
  engagementMetrics: {
    activeDays: {
      withPoints: {
        average: number;
        median: number;
      };
      withoutPoints: {
        average: number;
        median: number;
      };
    };
    tasksCreated: {
      withPoints: {
        total: number;
        average: number;
        median: number;
      };
      withoutPoints: {
        total: number;
        average: number;
        median: number;
      };
    };
    tasksCompleted: {
      withPoints: {
        total: number;
        average: number;
        median: number;
      };
      withoutPoints: {
        total: number;
        average: number;
        median: number;
      };
    };
  };
  userDetails?: any[];
}

const Gamification: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);

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

        if (validBoards.length > 0) {
          const firstBoardId = validBoards[0]._id || validBoards[0].id;
          setSelectedBoardId(firstBoardId);
        }
      } catch (error) {
        toast.error("Failed to load board list");
      } finally {
        setLoading(false);
      }
    };
    loadBoards();
  }, []);

  // Load gamification correlation data
  useEffect(() => {
    const loadGamificationData = async () => {
      try {
        setDataLoading(true);
        const params: any = {};
        if (selectedBoardId) {
          params.board_id = selectedBoardId;
        }

        const response = await getGamificationCorrelation(params);

        if (response?.success && response?.data) {
          setGamificationData(response.data);
        } else {
          toast.error("Failed to load gamification correlation data");
        }
      } catch (error: any) {
        console.error("Error loading gamification data:", error);
        toast.error(error?.response?.data?.message || "Failed to load gamification correlation data");
      } finally {
        setDataLoading(false);
      }
    };

    if (selectedBoardId || boards.length === 0) {
      loadGamificationData();
    }
  }, [selectedBoardId]);

  const getCorrelationColor = (strength: string | null) => {
    if (!strength) return "bg-gray-500";
    if (strength === "strong") return "bg-green-500";
    if (strength === "moderate") return "bg-blue-500";
    if (strength === "weak") return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getCorrelationIcon = (strength: string | null) => {
    if (!strength) return <Minus className="w-5 h-5" />;
    if (strength === "strong") return <TrendingUp className="w-5 h-5" />;
    if (strength === "moderate") return <Activity className="w-5 h-5" />;
    return <Minus className="w-5 h-5" />;
  };

  const translateUiText = (text: string | undefined | null) => {
    if (!text) return text || "";
    const map: Record<string, string> = {
      "Không có tương quan đáng kể": "No significant correlation",
      "Không đủ dữ liệu để tính toán correlation": "Not enough data to calculate correlation",
    };
    for (const k of Object.keys(map)) {
      if (text.includes(k)) return map[k];
    }
    return text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-xl p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-600" />
                Gamification Correlation Analysis
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Analyze the relationship between reward points and task completion rates
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
              <Trophy className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-slate-800 shadow-lg p-4 border-l-4 border-indigo-600">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Filter by Board:
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
          <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-800 shadow-lg">
            <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          </div>
        ) : !gamificationData ? (
          <div className="bg-white dark:bg-slate-800 shadow-lg p-12 text-center border-l-4 border-gray-400">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No data available. Please ensure there are users with gamification points.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards - Hexagonal Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{gamificationData.summary.totalUsers}</p>
              </div>

              {/* Users With Points */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Users With Points</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{gamificationData.summary.usersWithPoints}</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {gamificationData.summary.totalUsers > 0
                    ? ((gamificationData.summary.usersWithPoints / gamificationData.summary.totalUsers) * 100).toFixed(1)
                    : 0}% of total
                </p>
              </div>

              {/* Users Without Points */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Users Without Points</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{gamificationData.summary.usersWithoutPoints}</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
                  {gamificationData.summary.totalUsers > 0
                    ? ((gamificationData.summary.usersWithoutPoints / gamificationData.summary.totalUsers) * 100).toFixed(1)
                    : 0}% of total
                </p>
              </div>

              {/* Users With Tasks */}
              <div className="bg-white dark:bg-slate-800 shadow-lg p-6 border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">Users With Tasks</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{gamificationData.summary.usersWithTasks}</p>
              </div>
            </div>

            {/* Completion Rate Comparison - Asymmetric Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* With Points - Large Card */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 shadow-xl p-6 border-t-4 border-green-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Users With Points
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {gamificationData.completionRateComparison.withPoints.count} users
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {gamificationData.completionRateComparison.withPoints.averageCompletionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Median</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {gamificationData.completionRateComparison.withPoints.medianCompletionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Without Points - Small Card */}
              <div className="bg-white dark:bg-slate-800 shadow-xl p-6 border-t-4 border-red-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Without Points
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {gamificationData.completionRateComparison.withoutPoints.count} users
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Average</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {gamificationData.completionRateComparison.withoutPoints.averageCompletionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Median</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {gamificationData.completionRateComparison.withoutPoints.medianCompletionRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Difference Card */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 shadow-xl p-6 text-white border-l-4 border-indigo-300">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold mb-2">Completion Rate Difference</h2>
                  <p className="text-indigo-100 text-sm">
                    Users with points vs without points
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">
                    {gamificationData.completionRateComparison.difference > 0 ? "+" : ""}
                    {gamificationData.completionRateComparison.difference.toFixed(1)}%
                  </p>
                  <p className="text-indigo-100 text-sm mt-1">
                    {gamificationData.completionRateComparison.percentageDifference > 0 ? "+" : ""}
                    {gamificationData.completionRateComparison.percentageDifference.toFixed(1)}% difference
                  </p>
                </div>
              </div>
            </div>

            {/* Correlation & Engagement - Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Correlation Card */}
              <div className="bg-white dark:bg-slate-800 shadow-xl p-6 border-t-4 border-blue-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30">
                    <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Pearson Correlation
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Correlation between points and completion rate
                    </p>
                  </div>
                </div>
                {gamificationData.correlation.pearsonCoefficient !== null ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Coefficient</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {gamificationData.correlation.pearsonCoefficient.toFixed(4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border-l-4 border-gray-400">
                      <div className={`p-2 ${getCorrelationColor(gamificationData.correlation.strength)} text-white`}>
                        {getCorrelationIcon(gamificationData.correlation.strength)}
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Strength</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                          {gamificationData.correlation.strength || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Interpretation</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {translateUiText(gamificationData.correlation.interpretation)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        Not enough data to calculate correlation
                      </p>
                  </div>
                )}
              </div>

              {/* Engagement Metrics Card */}
              <div className="bg-white dark:bg-slate-800 shadow-xl p-6 border-t-4 border-purple-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30">
                    <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Engagement Metrics
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Compare engagement levels
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Active Days */}
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Active Days</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">With Points</p>
                        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {gamificationData.engagementMetrics.activeDays.withPoints.average.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Without Points</p>
                        <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                          {gamificationData.engagementMetrics.activeDays.withoutPoints.average.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Created */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Tasks Created (Avg)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">With Points</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {gamificationData.engagementMetrics.tasksCreated.withPoints.average.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Without Points</p>
                        <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                          {gamificationData.engagementMetrics.tasksCreated.withoutPoints.average.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Completed */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Tasks Completed (Avg)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">With Points</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {gamificationData.engagementMetrics.tasksCompleted.withPoints.average.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Without Points</p>
                        <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                          {gamificationData.engagementMetrics.tasksCompleted.withoutPoints.average.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics - Multi-column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tasks Created Details */}
              <div className="bg-white dark:bg-slate-800 shadow-xl p-6 border-t-4 border-blue-500">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Tasks Created
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">With Points</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {gamificationData.engagementMetrics.tasksCreated.withPoints.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Avg: {gamificationData.engagementMetrics.tasksCreated.withPoints.average.toFixed(1)} | 
                      Median: {gamificationData.engagementMetrics.tasksCreated.withPoints.median.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Without Points</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {gamificationData.engagementMetrics.tasksCreated.withoutPoints.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Avg: {gamificationData.engagementMetrics.tasksCreated.withoutPoints.average.toFixed(1)} | 
                      Median: {gamificationData.engagementMetrics.tasksCreated.withoutPoints.median.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tasks Completed Details */}
              <div className="bg-white dark:bg-slate-800 shadow-xl p-6 border-t-4 border-green-500">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Tasks Completed
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">With Points</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {gamificationData.engagementMetrics.tasksCompleted.withPoints.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Avg: {gamificationData.engagementMetrics.tasksCompleted.withPoints.average.toFixed(1)} | 
                      Median: {gamificationData.engagementMetrics.tasksCompleted.withPoints.median.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Without Points</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {gamificationData.engagementMetrics.tasksCompleted.withoutPoints.total}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Avg: {gamificationData.engagementMetrics.tasksCompleted.withoutPoints.average.toFixed(1)} | 
                      Median: {gamificationData.engagementMetrics.tasksCompleted.withoutPoints.median.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Days Details */}
              <div className="bg-white dark:bg-slate-800 shadow-xl p-6 border-t-4 border-purple-500">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Active Days
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">With Points</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {gamificationData.engagementMetrics.activeDays.withPoints.average.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Median: {gamificationData.engagementMetrics.activeDays.withPoints.median.toFixed(1)} days
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Without Points</p>
                    <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                      {gamificationData.engagementMetrics.activeDays.withoutPoints.average.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Median: {gamificationData.engagementMetrics.activeDays.withoutPoints.median.toFixed(1)} days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Gamification;

