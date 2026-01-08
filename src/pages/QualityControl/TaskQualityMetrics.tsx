import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTaskQualityMetrics, TaskQualityMetricsData } from '../../api/taskQualityApi';
import { fetchMyBoards } from '../../api/boardApi';
import toast from 'react-hot-toast';
import {
  Loader2,
  MessageSquare,
  Paperclip,
  Move,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  FileText,
} from 'lucide-react';

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

const TaskQualityMetrics: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [qualityData, setQualityData] = useState<TaskQualityMetricsData | null>(null);

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
        const boardIdFromUrl = searchParams.get('board');
        if (boardIdFromUrl && validBoards.some((b) => (b._id || b.id) === boardIdFromUrl)) {
          setSelectedBoardId(boardIdFromUrl);
        } else if (validBoards.length > 0) {
          setSelectedBoardId(validBoards[0]._id || validBoards[0].id || '');
        }
      } catch (error: any) {
        console.error('Error loading boards:', error);
        toast.error('Unable to load boards');
      } finally {
        setLoading(false);
      }
    };
    loadBoards();
  }, [searchParams]);

  // Load quality metrics when board changes
  useEffect(() => {
    if (selectedBoardId) {
      loadQualityMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoardId]);

  const loadQualityMetrics = async () => {
    if (!selectedBoardId) return;

    setDataLoading(true);
    try {
      const data = await getTaskQualityMetrics(selectedBoardId);
      setQualityData(data);
    } catch (error: any) {
      console.error('Error loading task quality metrics:', error);
      toast.error(error?.response?.data?.message || 'Unable to load task quality metrics');
    } finally {
      setDataLoading(false);
    }
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSearchParams({ board: boardId });
  };

  const getCollaborationScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    if (score >= 30) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  };

  const getCollaborationScoreLabel = (score: number) => {
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    if (score >= 30) return 'Weak';
    return 'Very weak';
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
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              Task Quality Metrics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Analyze task quality metrics: comments, attachments, change history and collaboration
              score.
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
                  {board.title || board.name || 'Untitled Board'}
                </option>
              ))}
            </select>
            <button
              onClick={loadQualityMetrics}
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
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {dataLoading && !qualityData ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Analyzing...</span>
        </div>
      ) : qualityData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] mb-[2px]">
            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total tasks</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {qualityData.summary.totalTasks}
                  </p>
                </div>
                <FileText className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg comments/task</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {qualityData.summary.averageCommentsPerTask.toFixed(1)}
                  </p>
                </div>
                <MessageSquare className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Avg attachments/task
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {qualityData.summary.averageAttachmentsPerTask.toFixed(1)}
                  </p>
                </div>
                <Paperclip className="h-10 w-10 text-purple-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Avg collaboration score
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {qualityData.summary.averageCollaborationScore.toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Additional Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] mb-[2px]">
            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Average churn count
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {qualityData.summary.averageChurnCount.toFixed(1)}
                  </p>
                </div>
                <Move className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-red-300 dark:border-red-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low Quality Tasks</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {qualityData.summary.lowQualityTasksCount}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-yellow-300 dark:border-yellow-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">High Churn Tasks</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {qualityData.summary.highChurnTasksCount}
                  </p>
                </div>
                <Move className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px] mb-[2px]">
            {/* Low Quality Tasks */}
            {qualityData.lowQualityTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 border border-red-300 dark:border-red-700">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Low Quality Tasks ({qualityData.lowQualityTasks.length})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  No comments — needs discussion
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {qualityData.lowQualityTasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Column: {task.column_name}
                            {task.assigned_to &&
                              ` • ${task.assigned_to.full_name || task.assigned_to.username}`}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-red-500 text-white font-semibold text-sm">
                          {task.collaborationScore}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>Comments: {task.commentCount}</div>
                        <div>Attachments: {task.attachmentCount}</div>
                        <div>Score: {task.collaborationScore}/100</div>
                      </div>
                      <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                        ⚠️ {task.warning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High Churn Tasks */}
            {qualityData.highChurnTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 border border-yellow-300 dark:border-yellow-700">
                <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-4 flex items-center gap-2">
                  <Move className="w-5 h-5" />
                  High Churn Tasks ({qualityData.highChurnTasks.length})
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Tasks moved multiple times between columns - may need review
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {qualityData.highChurnTasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Column: {task.column_name}
                            {task.assigned_to &&
                              ` • ${task.assigned_to.full_name || task.assigned_to.username}`}
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-yellow-500 text-white font-semibold text-sm">
                          {task.churnCount}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>Churn: {task.churnCount}</div>
                        <div>Comments: {task.commentCount}</div>
                        <div>Score: {task.collaborationScore}/100</div>
                      </div>
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        ⚠️ {task.warning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* All Tasks Table */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              All Tasks ({qualityData.tasks.length})
            </h2>
            {qualityData.tasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Task
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Column
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Assigned To
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Comments
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Attachments
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Churn
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Collaboration Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {qualityData.tasks.map((task) => (
                      <tr
                        key={task.task_id}
                        className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {task.title}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-700 dark:text-gray-300">
                            {task.column_name}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-700 dark:text-gray-300">
                            {task.assigned_to
                              ? task.assigned_to.full_name || task.assigned_to.username
                              : 'Unassigned'}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {task.commentCount}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-700 dark:text-gray-300">
                            {task.attachmentCount}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-gray-700 dark:text-gray-300">
                            {task.churnCount}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span
                            className={`px-3 py-1 text-sm font-semibold ${getCollaborationScoreColor(
                              task.collaborationScore,
                            )}`}
                          >
                            {task.collaborationScore} (
                            {getCollaborationScoreLabel(task.collaborationScore)})
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No task data available
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-10 border border-gray-200 dark:border-slate-700 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No data. Please select a Board and try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskQualityMetrics;
