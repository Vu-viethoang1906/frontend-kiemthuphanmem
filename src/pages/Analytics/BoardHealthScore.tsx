import React, { useState, useEffect } from "react";
import { getBoardHealthScore } from "../../api/analyticsApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Clock,
  Calendar,
  UserCheck,
  Target,
  Heart,
  Lightbulb,
  BarChart3,
  Zap,
} from "lucide-react";

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

interface HealthScoreData {
  success: boolean;
  healthScore: number;
  status: "Green" | "Yellow" | "Red";
  recommendations: string[];
  metrics: {
    completionRate: number;
    onTimeRate: number;
    avgCycleTime: number;
    dueDateCoverage: number;
    assignmentCoverage: number;
  };
}

const BoardHealthScore: React.FC = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [healthData, setHealthData] = useState<HealthScoreData | null>(null);

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
          console.error("Failed to load board list", error);
          toast.error("Failed to load board list");
      } finally {
        setLoading(false);
      }
    };
    loadBoards();
  }, []);

  // Load health score data
  const loadHealthScore = async () => {
    if (!selectedBoardId) {
      console.error("Please select a Board");
      return;
    }

    try {
      setDataLoading(true);
      const response = await getBoardHealthScore(selectedBoardId);

      if (response?.success && response?.data) {
        setHealthData(response.data);
      } else if (response?.data) {
        setHealthData(response.data);
      } else {
        console.error("Failed to load health score data");
      }
    } catch (error: any) {
      console.error("Error loading health score:", error);
      const message = error?.response?.data?.message || "Failed to load health score";
      console.error(message);
      toast.error(message);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && selectedBoardId) {
      loadHealthScore();
    }
  }, [selectedBoardId, loading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Green":
        return "text-green-600 bg-green-50 border-green-200";
      case "Yellow":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Red":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Green":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "Yellow":
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case "Red":
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Activity className="h-6 w-6 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getMetricColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return "text-green-600";
    if (value >= threshold * 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return "bg-green-500";
    if (value >= threshold * 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Board Health Score</h1>
        <p className="text-gray-600">
          Board health score (0-100) aggregated from 5 key metrics
        </p>
      </div>

      {/* Board Selector */}
      <div className="bg-white p-4 mb-[2px] border border-gray-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <BarChart3 className="inline h-4 w-4 mr-1" />
              Select Board
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Board --</option>
              {boards.map((board) => (
                <option key={board._id || board.id} value={board._id || board.id}>
                  {board.title || board.name || "Untitled Board"}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadHealthScore}
            disabled={dataLoading || !selectedBoardId}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {dataLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {dataLoading && !healthData ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : healthData ? (
        <>
          {/* Health Score Card */}
          <div className="bg-white p-8 mb-[2px] border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Board Health Score
                </h2>
                <p className="text-sm text-gray-600">
                  Aggregated from 5 weighted metrics
                </p>
              </div>
              {getStatusIcon(healthData.status)}
            </div>

            <div className="flex items-center gap-8">
              <div className="flex-1">
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`text-6xl font-bold ${getScoreColor(
                        healthData.healthScore
                      )}`}
                    >
                      {healthData.healthScore}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 text-sm font-semibold border ${getStatusColor(
                            healthData.status
                          )}`}
                        >
                          {healthData.status}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-3">
                        <div
                          className={`h-full ${getProgressColor(
                            healthData.healthScore
                          )}`}
                          style={{ width: `${healthData.healthScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2px] mb-[2px]">
            {/* Completion Rate (30%) */}
            <div className="bg-white p-5 border border-gray-200 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900">Completion Rate</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1">
                  30%
                </span>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-3xl font-bold ${getMetricColor(
                      healthData.metrics.completionRate
                    )}`}
                  >
                    {healthData.metrics.completionRate}%
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  % tasks in Done column
                </p>
              </div>
              <div className="w-full bg-gray-200 h-2">
                <div
                  className={`h-full ${getProgressColor(
                    healthData.metrics.completionRate
                  )}`}
                  style={{ width: `${healthData.metrics.completionRate}%` }}
                />
              </div>
            </div>

            {/* On-time Rate (30%) */}
            <div className="bg-white p-5 border border-gray-200 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold text-gray-900">On-time Rate</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1">
                  30%
                </span>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-3xl font-bold ${getMetricColor(
                      healthData.metrics.onTimeRate
                    )}`}
                  >
                    {healthData.metrics.onTimeRate}%
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  % tasks completed before due date
                </p>
              </div>
              <div className="w-full bg-gray-200 h-2">
                <div
                  className={`h-full ${getProgressColor(
                    healthData.metrics.onTimeRate
                  )}`}
                  style={{ width: `${healthData.metrics.onTimeRate}%` }}
                />
              </div>
            </div>

            {/* Cycle Time (20%) */}
            <div className="bg-white p-5 shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900">Cycle Time</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1">
                  20%
                </span>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {healthData.metrics.avgCycleTime}
                  </span>
                  <span className="text-sm text-gray-600">days</span>
                </div>
                <p className="text-xs text-gray-600">
                  Average (benchmark: 7 days)
                </p>
              </div>
              <div className="w-full bg-gray-200 h-2">
                <div
                  className={`h-full ${
                    healthData.metrics.avgCycleTime <= 7
                      ? "bg-green-500"
                      : healthData.metrics.avgCycleTime <= 14
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (7 / Math.max(healthData.metrics.avgCycleTime, 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Due Date Coverage (10%) */}
            <div className="bg-white p-5 shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Due Date Coverage</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1">
                  10%
                </span>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-3xl font-bold ${getMetricColor(
                      healthData.metrics.dueDateCoverage
                    )}`}
                  >
                    {healthData.metrics.dueDateCoverage}%
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  % tasks with due_date
                </p>
              </div>
              <div className="w-full bg-gray-200 h-2">
                <div
                  className={`h-full ${getProgressColor(
                    healthData.metrics.dueDateCoverage
                  )}`}
                  style={{ width: `${healthData.metrics.dueDateCoverage}%` }}
                />
              </div>
            </div>

            {/* Assignment Coverage (10%) */}
            <div className="bg-white p-5 shadow-sm border border-gray-200 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900">Assignment Coverage</h3>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1">
                  10%
                </span>
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-3xl font-bold ${getMetricColor(
                      healthData.metrics.assignmentCoverage
                    )}`}
                  >
                    {healthData.metrics.assignmentCoverage}%
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  % tasks assigned
                </p>
              </div>
              <div className="w-full bg-gray-200 h-2">
                <div
                  className={`h-full ${getProgressColor(
                    healthData.metrics.assignmentCoverage
                  )}`}
                  style={{
                    width: `${healthData.metrics.assignmentCoverage}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {healthData.recommendations && healthData.recommendations.length > 0 && (
            <div
              className={`bg-white p-6 shadow-sm border border-gray-200 ${
                healthData.status === "Green"
                  ? "border-l-4 border-l-green-500"
                  : healthData.status === "Yellow"
                  ? "border-l-4 border-l-yellow-500"
                  : "border-l-4 border-l-red-500"
              }`}
            >
              <div className="flex items-start gap-3 mb-4">
                <Lightbulb
                  className={`h-6 w-6 mt-0.5 ${
                    healthData.status === "Green"
                      ? "text-green-600"
                      : healthData.status === "Yellow"
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Recommendations
                  </h3>
                  <p className="text-sm text-gray-600">
                    Suggested actions to improve the board health score
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {healthData.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span
                      className={`mt-1 ${
                        healthData.status === "Green"
                          ? "text-green-600"
                          : healthData.status === "Yellow"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      •
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-10 text-center border border-gray-200">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a board to view the health score</p>
        </div>
      )}
    </div>
  );
};

export default BoardHealthScore;



