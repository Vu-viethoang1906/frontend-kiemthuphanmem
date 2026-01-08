import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getOverdueAnalysis, OverdueAnalysisData } from "../../api/overdueAnalysisApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  AlertTriangle,
  Users,
  Flag,
  Columns,
  TrendingUp,
  Clock,
  BarChart3,
  Target,
  UserX,
} from "lucide-react";

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

const OverdueAnalysis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<OverdueAnalysisData | null>(null);

  // Load boards
  useEffect(() => {
    const loadBoards = async () => {
      try {
        const boardsRes = await fetchMyBoards();
        let boards: any[] = [];
        if (boardsRes?.data) {
          boards = Array.isArray(boardsRes.data) ? boardsRes.data : [boardsRes.data];
        } else if (Array.isArray(boardsRes)) {
          boards = boardsRes;
        }

        const validBoards = boards.filter((b) => b && (b._id || b.id));
        setBoards(validBoards);

        // Get board from URL or use first board
        const boardIdFromUrl = searchParams.get("board");
        if (boardIdFromUrl && validBoards.some((b) => (b._id || b.id) === boardIdFromUrl)) {
          setSelectedBoardId(boardIdFromUrl);
        } else if (validBoards.length > 0) {
          setSelectedBoardId(validBoards[0]._id || validBoards[0].id || "");
        }
      } catch (error: any) {
        console.error("Error loading boards:", error);
        console.error("Unable to load boards list");
      } finally {
        setLoading(false);
      }
    };
    loadBoards();
  }, [searchParams]);

  // Load analysis data when board changes
  useEffect(() => {
    if (selectedBoardId) {
      loadAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoardId]);

  const loadAnalysis = async () => {
    if (!selectedBoardId) return;

    setDataLoading(true);
    try {
      const data = await getOverdueAnalysis(selectedBoardId);
      setAnalysisData(data);
    } catch (error: any) {
      console.error("Error loading overdue analysis:", error);
      toast.error(error?.response?.data?.message || "Unable to load overdue analysis");
    } finally {
      setDataLoading(false);
    }
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSearchParams({ board: boardId });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      case "low":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="py-6 px-4 bg-gray-100 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              Overdue Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed analysis of overdue tasks by user, priority, and column status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedBoardId}
              onChange={(e) => handleBoardChange(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={dataLoading}
            >
              {boards.map((board) => (
                <option key={board._id || board.id} value={board._id || board.id}>
                  {board.title || board.name || "Untitled Board"}
                </option>
              ))}
            </select>
            <button
              onClick={loadAnalysis}
              disabled={dataLoading || !selectedBoardId}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {dataLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {dataLoading && !analysisData ? (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Analyzing...</span>
          </div>
      ) : analysisData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-[2px] mb-[2px]">
            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total overdue tasks</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analysisData.totalOverdueTasks}
                  </p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average days overdue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analysisData.averageOverdueDays.toFixed(1)}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Users with overdue</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analysisData.breakdownByUser.length}
                  </p>
                </div>
                <Users className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Repeat offenders</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analysisData.repeatOffenders.length}
                  </p>
                </div>
                <UserX className="h-10 w-10 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px] mb-[2px]">
            {/* Breakdown by Priority */}
            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5 text-indigo-500" />
                Breakdown by Priority
              </h2>
              <div className="space-y-3">
                {Object.entries(analysisData.breakdownByPriority).map(([priority, data]) => (
                  <div key={priority} className="p-4 bg-gray-50 dark:bg-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white capitalize">
                        {priority === "none" ? "None" : priority}
                      </span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        {data.total}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Average: {data.avgDaysOverdue.toFixed(1)} days</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-slate-600 h-2">
                      <div
                        className={`h-2 ${
                          priority === "high"
                            ? "bg-red-500"
                            : priority === "medium"
                            ? "bg-yellow-500"
                            : priority === "low"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                        style={{
                          width: `${analysisData.totalOverdueTasks > 0 ? (data.total / analysisData.totalOverdueTasks) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Breakdown by Column */}
            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Columns className="w-5 h-5 text-indigo-500" />
                Breakdown by Column
              </h2>
              {analysisData.breakdownByColumn.length > 0 ? (
                <div className="space-y-3">
                  {analysisData.breakdownByColumn.map((col) => (
                    <div key={col.columnId} className="p-4 bg-gray-50 dark:bg-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{col.columnName}</span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          {col.total}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Average: {col.avgDaysOverdue.toFixed(1)} days</span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 dark:bg-slate-600 h-2">
                        <div
                          className="h-2 bg-indigo-500"
                          style={{
                            width: `${analysisData.totalOverdueTasks > 0 ? (col.total / analysisData.totalOverdueTasks) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No data
                </p>
              )}
            </div>
          </div>

          {/* Breakdown by User */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700 mb-[2px]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Breakdown by User
            </h2>
            {analysisData.breakdownByUser.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        User
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Overdue Count
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Average Days Overdue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.breakdownByUser.map((user) => (
                      <tr
                        key={user.userId}
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {user.fullName || user.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold">
                            {user.violationCount}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                            <span className="text-gray-900 dark:text-white font-semibold">
                            {user.avgDaysOverdue.toFixed(1)} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No users have overdue tasks
              </p>
            )}
          </div>

          {/* Repeat Offenders */}
          {analysisData.repeatOffenders.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 border border-red-300 dark:border-red-700 mb-[2px]">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                <UserX className="w-5 h-5" />
                Repeat Offenders (&gt;3 overdue tasks/tháng)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisData.repeatOffenders.map((offender) => (
                  <div
                    key={offender.userId}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {offender.fullName || offender.username}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{offender.email}</div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-red-500 text-white font-bold text-sm">
                        {offender.violationCount} overdue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Tasks List */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Overdue Tasks List ({analysisData.overdueTasks.length})
            </h2>
            {analysisData.overdueTasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Task
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Assignee
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Priority
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Column
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Due Date
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Overdue (days)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisData.overdueTasks.map((task) => (
                      <tr
                        key={task.taskId}
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white">{task.title}</div>
                        </td>
                        <td className="py-3 px-4">
                          {task.assignedTo ? (
                            <div>
                              <div className="text-sm text-gray-900 dark:text-white">
                                {task.assignedTo.fullName || task.assignedTo.username}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Unassigned</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority === "none" ? "N/A" : task.priority.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{task.columnName}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(task.dueDate).toLocaleDateString("en-US")}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold text-sm">
                            {task.daysOverdue} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No overdue tasks
              </p>
            )}
          </div>
        </>
      ) : (
          <div className="bg-white dark:bg-slate-800 shadow-lg p-10 rounded-lg border border-gray-200 dark:border-slate-700 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No data. Please select a board and try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default OverdueAnalysis;

