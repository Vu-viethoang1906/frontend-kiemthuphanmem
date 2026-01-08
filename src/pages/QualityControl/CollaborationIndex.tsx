import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getCollaborationIndex, CollaborationIndexData } from "../../api/collaborationApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  Users,
  MessageSquare,
  AtSign,
  UserCheck,
  Clock,
  TrendingUp,
  Network,
  Award,
  AlertCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

const CollaborationIndex: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [collaborationData, setCollaborationData] = useState<CollaborationIndexData | null>(null);

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

  // Load collaboration data when board changes
  useEffect(() => {
    if (selectedBoardId) {
      loadCollaborationData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoardId]);

  const loadCollaborationData = async () => {
    if (!selectedBoardId) return;

    setDataLoading(true);
    try {
      const data = await getCollaborationIndex(selectedBoardId);
      setCollaborationData(data);
    } catch (error: any) {
      console.error("Error loading collaboration index:", error);
      toast.error(error?.response?.data?.message || "Unable to load collaboration index");
    } finally {
      setDataLoading(false);
    }
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSearchParams({ board: boardId });
  };

  const getCollaborationScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (score >= 50) return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    if (score >= 30) return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
    return "text-red-600 bg-red-50 dark:bg-red-900/20";
  };

  const getCollaborationScoreLabel = (score: number) => {
    if (score >= 70) return "Good";
    if (score >= 50) return "Average";
    if (score >= 30) return "Weak";
    return "Very Weak";
  };

  // Convert minutes to days and hours format
  const formatResponseTime = (minutes: number): string => {
    if (minutes <= 0) return "N/A";
    
    const totalHours = Math.floor(minutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const remainingMinutes = Math.round(minutes % 60);

    if (days > 0) {
      if (hours > 0) {
        return `${days} ngày ${hours} giờ`;
      }
      return `${days} ngày`;
    } else if (hours > 0) {
      if (remainingMinutes > 0) {
        return `${hours} giờ ${remainingMinutes} phút`;
      }
      return `${hours} giờ`;
    } else {
      return `${remainingMinutes} phút`;
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
              <Network className="w-8 h-8 text-indigo-600" />
              Collaboration Index
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Analysis of collaboration metrics: comment frequency, @mentions, shared work, and response time.
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
              onClick={loadCollaborationData}
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

      {dataLoading && !collaborationData ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <span className="ml-3 text-lg text-gray-700 dark:text-gray-300">Analyzing...</span>
        </div>
      ) : collaborationData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] mb-[2px]">
            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total users</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {collaborationData.summary.totalUsers}
                  </p>
                </div>
                <Users className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total comments</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {collaborationData.summary.totalComments}
                  </p>
                </div>
                <MessageSquare className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average collaboration score</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {collaborationData.summary.averageCollaborationScore.toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-indigo-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Average response time</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {collaborationData.summary.averageResponseTimeMinutes.toFixed(1)} mins
                  </p>
                </div>
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Additional Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] mb-[2px]">
            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total @mentions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {collaborationData.summary.totalMentions}
                  </p>
                </div>
                <AtSign className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Multi-collaborator tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {collaborationData.summary.totalMultiCollaboratorTasks}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-teal-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Network connections</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {collaborationData.edges.length}
                  </p>
                </div>
                <Network className="h-8 w-8 text-pink-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px] mb-[2px]">
            {/* Good Collaborators */}
            {collaborationData.groupAnalysis.goodCollaborators.count > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 border border-green-300 dark:border-green-700">
                <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Good Collaborators ({collaborationData.groupAnalysis.goodCollaborators.count})
                </h2>
                <div className="space-y-3">
                  {collaborationData.groupAnalysis.goodCollaborators.users.map((user) => {
                    const fullUser = collaborationData.collaborationMetrics.find(
                      (m) => m.userId === user.userId
                    );
                    return (
                      <div
                        key={user.userId}
                        className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {fullUser ? (
                                collaborationData.nodes.find((n) => n.userId === user.userId)?.fullName ||
                                collaborationData.nodes.find((n) => n.userId === user.userId)?.username ||
                                "Unknown"
                              ) : "Unknown"}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Score: {user.collaborationScore}/100
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-500 text-white font-semibold text-sm">
                            {user.collaborationScore}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <div>Comments: {user.commentCount}</div>
                          <div>Mentions: {user.mentionsGiven + user.mentionsReceived}</div>
                          <div>Tasks: {fullUser?.multiCollaboratorTasks || 0}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Poor Collaborators */}
            {collaborationData.groupAnalysis.poorCollaborators.count > 0 && (
              <div className="bg-white dark:bg-slate-800 p-6 border border-red-300 dark:border-red-700">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Poor Collaborators ({collaborationData.groupAnalysis.poorCollaborators.count})
                </h2>
                <div className="space-y-3">
                  {collaborationData.groupAnalysis.poorCollaborators.users.map((user) => {
                    const fullUser = collaborationData.collaborationMetrics.find(
                      (m) => m.userId === user.userId
                    );
                    return (
                      <div
                        key={user.userId}
                        className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {fullUser ? (
                                collaborationData.nodes.find((n) => n.userId === user.userId)?.fullName ||
                                collaborationData.nodes.find((n) => n.userId === user.userId)?.username ||
                                "Unknown"
                              ) : "Unknown"}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Score: {user.collaborationScore}/100
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-red-500 text-white font-semibold text-sm">
                            {user.collaborationScore}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <div>Comments: {user.commentCount}</div>
                          <div>Mentions: {user.mentionsGiven + user.mentionsReceived}</div>
                          <div>Tasks: {fullUser?.multiCollaboratorTasks || 0}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Collaboration Metrics Table */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700 mb-[2px]">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Collaboration Metrics by User
            </h2>
            {collaborationData.collaborationMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        User
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Collaboration Score
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Comments
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Mentions Given
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Mentions Received
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Multi-collab Tasks
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Tỷ lệ Response Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {collaborationData.collaborationMetrics.map((metric) => {
                      const node = collaborationData.nodes.find((n) => n.userId === metric.userId);
                      return (
                        <tr
                          key={metric.userId}
                          className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {node?.fullName || node?.username || "Unknown"}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{node?.email}</div>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span
                              className={`px-3 py-1 text-sm font-semibold ${getCollaborationScoreColor(
                                metric.collaborationScore
                              )}`}
                            >
                              {metric.collaborationScore} ({getCollaborationScoreLabel(metric.collaborationScore)})
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-gray-900 dark:text-white font-semibold">
                              {metric.commentCount}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-gray-700 dark:text-gray-300">{metric.mentionsGiven}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-gray-700 dark:text-gray-300">{metric.mentionsReceived}</span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-gray-700 dark:text-gray-300">
                              {metric.multiCollaboratorTasks}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className="text-gray-700 dark:text-gray-300">
                              {metric.avgResponseTimeMinutes > 0
                                  ? `${metric.avgResponseTimeMinutes.toFixed(1)} mins`
                                  : "N/A"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No collaboration data
              </p>
            )}
          </div>

          {/* Network Graph Info */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-500" />
              Network Graph Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nodes (Users)</div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {collaborationData.nodes.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of users in the network
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Edges (Connections)</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {collaborationData.edges.length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of connections between users
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> Network graph data (nodes, edges, graph) is ready for visualization using
                libraries such as D3.js, vis.js, or react-force-graph. Data includes user-to-user interactions
                with weights based on comments, mentions, and multi-collaborator tasks.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-10 border border-gray-200 dark:border-slate-700 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600 dark:text-gray-400">
            No data. Please select a board and try again.
          </p>
        </div>
      )}
    </div>
  );
};

export default CollaborationIndex;

