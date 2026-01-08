import React, { useState, useEffect } from "react";
import { trackBehavior } from "../../api/adaptiveGamificationApi";
import { getLeaderboard } from "../../api/analyticsApi";
import { getAllCenters } from "../../api/centerApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Trophy,
  Award,
  Users,
  AlertTriangle,
  TrendingUp,
  Target,
  Shield,
  Medal,
  Star,
  Filter,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

interface Center {
  _id: string;
  name: string;
}

interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  centerId: string | null;
  centerName: string | null;
  points: number;
  totalPoints: number;
  level: number;
  statistics: {
    tasksCompleted: number;
    onTimeCompleted: number;
    overdueCompleted: number;
    onTimeRate: number;
  };
  pointsPerTaskRatio: number;
}

interface FlaggedUser {
  userId: string;
  username: string;
  fullName: string;
  points: number;
  tasksCompleted: number;
  pointsPerTaskRatio: number;
  thresholdRatio: number;
  deviation: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardUser[];
  cheatDetection: {
    medianRatio: number;
    thresholdRatio: number;
    flaggedUsers: FlaggedUser[];
    flaggedCount: number;
  };
  summary: {
    totalUsers: number;
    averagePoints: number;
    averageTasksCompleted: number;
  };
  dateRange: {
    start: string;
    end: string;
  } | null;
}

const PointManagement: React.FC = () => {
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [limit, setLimit] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);

  // Load centers
  useEffect(() => {
    const loadCenters = async () => {
      try {
        const response = await getAllCenters();
        if (response?.success && response?.data) {
          setCenters(response.data);
        } else if (Array.isArray(response)) {
          setCenters(response);
        }
      } catch (error) {
        console.error("Failed to load centers:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCenters();
  }, []);

  // Load leaderboard data
  const loadLeaderboard = async () => {
    try {
      setDataLoading(true);
      const params: any = {
        limit,
      };
      if (selectedCenterId) {
        params.center_id = selectedCenterId;
      }
      if (startDate) {
        params.start_date = startDate;
      }
      if (endDate) {
        params.end_date = endDate;
      }

      const response = await getLeaderboard(params);

      if (response?.success && response?.data) {
        setLeaderboardData(response.data);
      } else if (response?.data) {
        setLeaderboardData(response.data);
      } else {
        toast.error("Failed to load leaderboard data");
      }
    } catch (error: any) {
      console.error("Error loading leaderboard:", error);
      toast.error(error?.response?.data?.message || "Failed to load leaderboard");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      loadLeaderboard();
      // Track behavior: user views leaderboard
      if (selectedCenterId) {
        trackBehavior(selectedCenterId, "view_leaderboard", "leaderboard", {
          position: 1, // User is viewing leaderboard
        }).catch(console.error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCenterId, startDate, endDate, limit, loading]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-gray-600">#{rank}</span>;
  };

  const getLevelBadge = (level: number) => {
    if (level >= 50) return "bg-purple-100 text-purple-800";
    if (level >= 30) return "bg-blue-100 text-blue-800";
    if (level >= 20) return "bg-green-100 text-green-800";
    if (level >= 10) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">Point Management</h1>
        <p className="text-gray-600">
          Leaderboard of users by gamification points with detailed stats and cheat detection
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 mb-[2px] border border-gray-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="inline h-4 w-4 mr-1" />
              Center
            </label>
            <select
              value={selectedCenterId}
              onChange={(e) => setSelectedCenterId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Centers</option>
              {centers.map((center) => (
                <option key={center._id} value={center._id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="min-w-[120px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="inline h-4 w-4 mr-1" />
              Giới hạn
            </label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 100)}
              min={1}
              max={500}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={loadLeaderboard}
            disabled={dataLoading}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {dataLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Filter className="h-4 w-4" />
            )}
            Filter
          </button>
        </div>
      </div>

      {dataLoading && !leaderboardData ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : leaderboardData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] mb-[2px]">
            <div className="bg-white p-5 border border-gray-200 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaderboardData.summary.totalUsers}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-5 border border-gray-200 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Points</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(leaderboardData.summary.averagePoints ?? 0).toFixed(1)}
                  </p>
                </div>
                <Award className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-5 border border-gray-200 border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(leaderboardData.summary.averageTasksCompleted ?? 0).toFixed(1)}
                  </p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-5 border border-gray-200 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Flagged For Cheating</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {leaderboardData.cheatDetection.flaggedCount}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Cheat Detection Section */}
          {leaderboardData.cheatDetection.flaggedCount > 0 && (
            <div className="bg-red-50 border border-red-200 p-5 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="h-6 w-6 text-red-600 mt-0.5" />
                <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-1">
                    Cheat Detection
                  </h3>
                  <p className="text-sm text-red-700">
                    Detected {leaderboardData.cheatDetection.flaggedCount} users with anomalous points-per-task ratios
                    (exceeding {(leaderboardData.cheatDetection.thresholdRatio ?? 0).toFixed(2)}x median)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {leaderboardData.cheatDetection.flaggedUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="bg-white p-4 border border-red-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="font-semibold text-gray-900">
                          {user.fullName || user.username}
                        </span>
                      </div>
                      <span className="text-sm text-red-600 font-medium">
                        +{(user.deviation ?? 0).toFixed(1)}% anomaly
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Points: </span>
                        <span className="font-semibold">{user.points}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tasks: </span>
                        <span className="font-semibold">{user.tasksCompleted}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Ratio: </span>
                        <span className="font-semibold text-red-600">
                          {user.pointsPerTaskRatio === 999999 ? "∞" : (user.pointsPerTaskRatio ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Threshold: </span>
                        <span className="font-semibold">{(user.thresholdRatio ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-white shadow-sm border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Leaderboard
              </h2>
              {leaderboardData.dateRange && (
                <p className="text-sm text-gray-600 mt-1">
                  From {leaderboardData.dateRange.start} to {leaderboardData.dateRange.end}
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Center
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tasks Completed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      On-time Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Points/Task
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboardData.leaderboard.map((user) => {
                    const isFlagged = leaderboardData.cheatDetection.flaggedUsers.some(
                      (f) => f.userId === user.userId
                    );
                    return (
                      <tr
                        key={user.userId}
                        className={`hover:bg-gray-50 ${
                          isFlagged ? "bg-red-50" : ""
                        }`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {getRankIcon(user.rank)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.fullName || user.username || ""}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-600" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.fullName || user.username || "N/A"}
                              </div>
                              {user.username && user.fullName && (
                                <div className="text-sm text-gray-500">
                                  @{user.username}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {user.centerName || "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold text-gray-900">
                              {user.points.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Tổng: {user.totalPoints.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold ${getLevelBadge(
                              user.level
                            )}`}
                          >
                            Lv.{user.level}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {user.statistics.tasksCompleted}
                          </div>
                          <div className="text-xs text-gray-500">
                            Đúng hạn: {user.statistics.onTimeCompleted} | Trễ:{" "}
                            {user.statistics.overdueCompleted}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {(user.statistics.onTimeRate ?? 0) >= 80 ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (user.statistics.onTimeRate ?? 0) >= 50 ? (
                              <Clock className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={`text-sm font-medium ${
                                (user.statistics.onTimeRate ?? 0) >= 80
                                  ? "text-green-600"
                                  : (user.statistics.onTimeRate ?? 0) >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {(user.statistics.onTimeRate ?? 0).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {isFlagged && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={`text-sm font-semibold ${
                                isFlagged ? "text-red-600" : "text-gray-900"
                              }`}
                            >
                              {user.pointsPerTaskRatio === 999999
                                ? "∞"
                                : (user.pointsPerTaskRatio ?? 0).toFixed(2)}
                            </span>
                          </div>
                          {(leaderboardData.cheatDetection.medianRatio ?? 0) > 0 && (
                            <div className="text-xs text-gray-500">
                              Median: {(leaderboardData.cheatDetection.medianRatio ?? 0).toFixed(2)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-10 text-center border border-gray-200">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không có dữ liệu leaderboard</p>
        </div>
      )}
    </div>
  );
};

export default PointManagement;
