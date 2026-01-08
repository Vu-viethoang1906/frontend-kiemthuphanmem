import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAtRiskTasksByBoard,
  getAtRiskTasksByUser,
  detectAtRiskTasks,
  AtRiskTask,
} from "../../api/atRiskApi";
import { fetchMyBoards } from "../../api/boardApi";
import { socket } from "../../socket";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
  Clock,
  User,
  Calendar,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

const AtRiskTasks: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"board" | "user">("board");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [atRiskTasks, setAtRiskTasks] = useState<AtRiskTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AtRiskTask[]>([]);
  const [sortBy, setSortBy] = useState<"risk_score" | "due_date" | "detected_at">("risk_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [riskFilter, setRiskFilter] = useState<string>("all"); // all, high, medium, low
  const [ruleFilter, setRuleFilter] = useState<string>("all");
  const [boardQuery, setBoardQuery] = useState<string>("");
  const [showBoardDropdown, setShowBoardDropdown] = useState<boolean>(false);

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
          const found = validBoards.find((b) => (b._id || b.id) === boardIdFromUrl);
          if (found) {
            setBoardQuery(found?.title || found?.name || "");
          }
        } else if (validBoards.length > 0 && viewMode === "board") {
          const firstBoardId = validBoards[0]._id || validBoards[0].id;
          setSelectedBoardId(firstBoardId);
          updateURL(firstBoardId);
          setBoardQuery(validBoards[0].title || validBoards[0].name || "");
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
    if (!selectedBoardId) {
      setBoardQuery("");
      return;
    }
    const found = boards.find((b) => (b._id || b.id) === selectedBoardId);
    if (found) {
      setBoardQuery(found.title || found.name || "");
    }
  }, [selectedBoardId, boards]);

  useEffect(() => {
    const loadAtRiskTasks = async () => {
      if (viewMode === "board" && !selectedBoardId) return;

      try {
        setDataLoading(true);
        let response;
        if (viewMode === "board") {
          response = await getAtRiskTasksByBoard(selectedBoardId);
        } else {
          const userId = localStorage.getItem("userId");
          response = await getAtRiskTasksByUser(userId || undefined);
        }

        if (response?.success && response?.data) {
          setAtRiskTasks(response.data);
        } else {
          toast.error("Failed to load at-risk tasks");
          setAtRiskTasks([]);
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load at-risk tasks");
        setAtRiskTasks([]);
      } finally {
        setDataLoading(false);
      }
    };

    loadAtRiskTasks();
  }, [selectedBoardId, viewMode]);

  useEffect(() => {
    let filtered = [...atRiskTasks];

    if (riskFilter !== "all") {
      filtered = filtered.filter((task) => {
        const score = task.risk_score;
        if (riskFilter === "high") return score >= 1.5;
        if (riskFilter === "medium") return score >= 0.8 && score < 1.5;
        if (riskFilter === "low") return score < 0.8;
        return true;
      });
    }

    if (ruleFilter !== "all") {
      filtered = filtered.filter((task) =>
        task.risk_reasons.some((reason) => reason.rule_name === ruleFilter)
      );
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "risk_score":
          aValue = a.risk_score;
          bValue = b.risk_score;
          break;
        case "due_date":
          aValue = a.task_id?.due_date ? new Date(a.task_id.due_date).getTime() : 0;
          bValue = b.task_id?.due_date ? new Date(b.task_id.due_date).getTime() : 0;
          break;
        case "detected_at":
          aValue = new Date(a.detected_at).getTime();
          bValue = new Date(b.detected_at).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTasks(filtered);
  }, [atRiskTasks, riskFilter, ruleFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (!socket) return;

    const handleAtRiskTaskDetected = (data: any) => {
      toast.success(`New at-risk task detected: ${data.task_title || data.task?.title || "Unknown task"}`);
      if (viewMode === "board" && selectedBoardId) {
        getAtRiskTasksByBoard(selectedBoardId).then((response) => {
          if (response?.success && response?.data) {
            setAtRiskTasks(response.data);
          }
        });
      } else {
        const userId = localStorage.getItem("userId");
        getAtRiskTasksByUser(userId || undefined).then((response) => {
          if (response?.success && response?.data) {
            setAtRiskTasks(response.data);
          }
        });
      }
    };

    socket.on("at_risk_task_detected", handleAtRiskTaskDetected);

    return () => {
      socket.off("at_risk_task_detected", handleAtRiskTaskDetected);
    };
  }, [viewMode, selectedBoardId]);

  const updateURL = (boardId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("board", boardId);
    setSearchParams(newParams);
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    updateURL(boardId);
  };

  const normalize = (s: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const filteredBoards = React.useMemo(() => {
    const q = normalize(boardQuery);
    const list = boards.map((b) => ({
      id: b._id || b.id || "",
      label: b.title || b.name || "Untitled Board",
    }));
    if (!q) return list;
    return list
      .filter((i) => normalize(i.label).includes(q))
      .sort((a, b) => normalize(a.label).indexOf(q) - normalize(b.label).indexOf(q));
  }, [boards, boardQuery]);

  const handleDetect = async () => {
    try {
      setDataLoading(true);
      const boardId = viewMode === "board" ? selectedBoardId : undefined;
      const response = await detectAtRiskTasks(boardId);
      if (response?.success) {
        toast.success(response.message || "Detection completed");
        // Reload tasks
        if (viewMode === "board" && selectedBoardId) {
          const reloadResponse = await getAtRiskTasksByBoard(selectedBoardId);
          if (reloadResponse?.success && reloadResponse?.data) {
            setAtRiskTasks(reloadResponse.data);
          }
        } else {
          const userId = localStorage.getItem("userId");
          const reloadResponse = await getAtRiskTasksByUser(userId || undefined);
          if (reloadResponse?.success && reloadResponse?.data) {
            setAtRiskTasks(reloadResponse.data);
          }
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to detect at-risk tasks");
    } finally {
      setDataLoading(false);
    }
  };

  

  const handleViewTask = (boardId: string, taskId: string) => {
    navigate(`/project/${boardId}/${taskId}`);
  };

  const getRiskLevel = (score: number) => {
    if (score >= 1.5) return { label: "High", color: "red" };
    if (score >= 0.8) return { label: "Medium", color: "orange" };
    return { label: "Low", color: "yellow" };
  };

  const getRuleName = (ruleName: string) => {
    const names: Record<string, string> = {
      unassigned_near_deadline: "Unassigned & near deadline",
      stuck_in_column: "Stuck in column",
      user_has_many_overdue: "User has many overdue tasks",
      high_estimate_low_time: "High estimate & low remaining time",
    };
    return names[ruleName] || ruleName;
  };

  const getRuleIcon = (ruleName: string) => {
    switch (ruleName) {
      case "unassigned_near_deadline":
        return <User className="w-4 h-4" />;
      case "stuck_in_column":
        return <Clock className="w-4 h-4" />;
      case "user_has_many_overdue":
        return <AlertTriangle className="w-4 h-4" />;
      case "high_estimate_low_time":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const translateRecommendation = (text: string) => {
    const raw = text || "";
    const norm = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const normNoDash = norm.replace(/[–—-]+/g, " ");

    const daysMatch = /stuck\s+(\d+)\s+ngay/i.exec(raw);
    const colMatch = /cot\s+"([^"]+)"/i.exec(
      raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    const overdueCount = /(\d+)\s*task\s*qua han/i.exec(
      raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    const notStartedRegex = /task\s*chua\s*(duoc\s*)?bat\s*dau/;
    if (notStartedRegex.test(normNoDash) || normNoDash.includes("task chua bat dau")) {
      return "Task not started yet — please check if the assignee forgot or is delaying.";
    }
    if (normNoDash.includes("kiem tra") && notStartedRegex.test(normNoDash)) {
      return "Task not started yet — please check if the assignee forgot or is delaying.";
    }
    if (norm.includes("lien he") && norm.includes("hoc vien")) {
      const days = daysMatch ? daysMatch[1] : undefined;
      const col = colMatch ? colMatch[1] : undefined;
      return `Contact the student to clarify blockers${
        days ? `; stuck for ${days} day(s)` : ""
      }${col ? ` in column "${col}"` : ""}.`;
    }
    if (norm.includes("phan bo") || norm.includes("giam workload")) {
      const count = overdueCount ? overdueCount[1] : undefined;
      return `Consider reassigning or reducing workload for the student${
        count ? ` (currently has ${count} overdue task(s))` : ""
      }.`;
    }
    if (norm.includes("uu tien cac task quan trong") || norm.includes("deadline gan nhat")) {
      return "Prioritize important tasks and the nearest deadlines.";
    }

    return raw;
  };

  const translateUiRecommendationFallback = (raw: string, translated: string) => {
    // If translateRecommendation already changed it, prefer that.
    if (translated && translated !== raw) return translated;

    if (!raw) return translated || raw;

    const map: Record<string, string> = {
      // common Vietnamese recommendation phrases -> English
      "Task chưa được bắt đầu": "Task not started yet — please check if the assignee forgot or is delaying.",
      "Task chưa được bắt đầu - cần kiểm tra xem học viên có quên hoặc trì hoãn không":
        "Task not started yet — please check if the assignee forgot or is delaying.",
      "Các công việc có cycle time vượt quá": "Tasks with cycle time exceeding",
    };

    for (const k of Object.keys(map)) {
      if (raw.includes(k)) return map[k];
    }

    return translated || raw;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const stats = {
    total: atRiskTasks.length,
    high: atRiskTasks.filter((t) => t.risk_score >= 1.5).length,
    medium: atRiskTasks.filter((t) => t.risk_score >= 0.8 && t.risk_score < 1.5).length,
    low: atRiskTasks.filter((t) => t.risk_score < 0.8).length,
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-slate-900 min-h-screen">
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                At-Risk Task Detection
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Automatically detects tasks at risk of being overdue based on rule-based scoring
              </p>
            </div>
            <button
              onClick={handleDetect}
              disabled={dataLoading || (viewMode === "board" && !selectedBoardId)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${dataLoading ? "animate-spin" : ""}`} />
              Run detection
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-[2px] mb-[2px]">
          <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 border-t-4 border-t-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <div className="p-2 ring-1 ring-indigo-300/40 text-indigo-600 dark:text-indigo-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 border-t-4 border-t-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">High risk</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.high}</p>
              </div>
              <div className="p-2 ring-1 ring-red-300/40 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 border-t-4 border-t-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Medium risk</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.medium}</p>
              </div>
              <div className="p-2 ring-1 ring-orange-300/40 text-orange-600 dark:text-orange-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 border-t-4 border-t-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low risk</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.low}</p>
              </div>
              <div className="p-2 ring-1 ring-yellow-300/40 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 mb-[2px]">
          <div className="flex flex-wrap gap-4 md:gap-6 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                View mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => {
                  setViewMode(e.target.value as "board" | "user");
                  if (e.target.value === "user") {
                    setSelectedBoardId("");
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="board">By Board</option>
                <option value="user">By User</option>
              </select>
            </div>

            {viewMode === "board" && (
              <div className="flex-1 min-w-[220px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Board
                </label>
                <div className="relative">
                  <input
                    value={boardQuery}
                    onChange={(e) => {
                      setBoardQuery(e.target.value);
                      setShowBoardDropdown(true);
                    }}
                    onFocus={() => setShowBoardDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredBoards.length > 0) {
                        handleBoardChange(filteredBoards[0].id);
                        setShowBoardDropdown(false);
                      }
                      if (e.key === "Escape") setShowBoardDropdown(false);
                    }}
                    placeholder="Select board..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {showBoardDropdown && (
                    <div
                      className="absolute z-20 mt-1 w-full max-h-64 overflow-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {filteredBoards.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No results</div>
                      ) : (
                        filteredBoards.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700/60 ${
                              selectedBoardId === item.id ? "bg-gray-50 dark:bg-slate-700/40" : ""
                            }`}
                            onClick={() => {
                              handleBoardChange(item.id);
                              setBoardQuery(item.label);
                              setShowBoardDropdown(false);
                            }}
                          >
                            {item.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rules
              </label>
              <select
                value={ruleFilter}
                onChange={(e) => setRuleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="unassigned_near_deadline">Unassigned & near deadline</option>
                <option value="stuck_in_column">Stuck in column</option>
                <option value="user_has_many_overdue">User has many overdue tasks</option>
                <option value="high_estimate_low_time">High estimate & low remaining time</option>
              </select>
            </div>
          </div>
        </div>

        
        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No at-risk tasks found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const riskLevel = getRiskLevel(task.risk_score);
              const daysUntilDue = getDaysUntilDue(task.task_id?.due_date);
              const boardId = task.board_id?._id || "";
              const taskId = task.task_id?._id || "";
              const riskBorderClass =
                riskLevel.color === "red"
                  ? "border-l-4 border-red-500"
                  : riskLevel.color === "orange"
                  ? "border-l-4 border-orange-500"
                  : "border-l-4 border-yellow-500";

              return (
                <div
                  key={task._id || taskId}
                  className={`bg-white dark:bg-slate-800 p-6 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors border border-gray-200 dark:border-slate-700 ${riskBorderClass}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {task.task_id?.title || "Untitled Task"}
                        </h3>
                        <span
                          className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            riskLevel.color === "red"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700"
                              : riskLevel.color === "orange"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border border-orange-300 dark:border-orange-700"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700"
                          }`}
                        >
                          {riskLevel.label} ({task.risk_score.toFixed(2)})
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {task.task_id?.due_date ? formatDate(task.task_id.due_date) : "No due date"}
                          {daysUntilDue !== null && (
                            <span
                              className={`ml-2 ${
                                daysUntilDue < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : daysUntilDue < 3
                                  ? "text-orange-600 dark:text-orange-400"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              ({daysUntilDue < 0 ? `Overdue by ${Math.abs(daysUntilDue)} day(s)` : `${daysUntilDue} day(s) left`})
                            </span>
                          )}
                        </span>
                        {task.task_id?.assigned_to && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {task.task_id.assigned_to.full_name ||
                              task.task_id.assigned_to.username ||
                              task.task_id.assigned_to.email}
                          </span>
                        )}
                        {task.task_id?.column_id && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {task.task_id.column_id.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewTask(boardId, taskId)}
                        className="px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Risk indicators:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {task.risk_reasons.map((reason, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-slate-700"
                        >
                          <div className="mt-0.5 text-orange-600 dark:text-orange-400">
                            {getRuleIcon(reason.rule_name)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {getRuleName(reason.rule_name)} (Score: {reason.score})
                            </p>
                            {reason.details && (
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {reason.rule_name === "unassigned_near_deadline" &&
                                  reason.details.days_until_due !== undefined && (
                                    <span>{reason.details.days_until_due} day(s) until due</span>
                                  )}
                                {reason.rule_name === "stuck_in_column" &&
                                  reason.details.days_in_column !== undefined && (
                                    <span>
                                      Stuck for {reason.details.days_in_column} day(s) in column "
                                      {reason.details.column_name}"
                                    </span>
                                  )}
                                {reason.rule_name === "user_has_many_overdue" &&
                                  reason.details.overdue_count !== undefined && (
                                    <span>Has {reason.details.overdue_count} other overdue task(s)</span>
                                  )}
                                {reason.rule_name === "high_estimate_low_time" &&
                                  reason.details.estimate_hours !== undefined &&
                                  reason.details.hours_remaining !== undefined && (
                                    <span>
                                      Estimated {reason.details.estimate_hours}h but only {reason.details.hours_remaining.toFixed(1)}h left
                                    </span>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {task.recommendations && task.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {task.recommendations.map((rec, idx) => {
                          const translated = translateRecommendation(rec);
                          const finalText = translateUiRecommendationFallback(rec, translated);
                          return <li key={idx}>{finalText}</li>;
                        })}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>Detected at: {formatDate(task.detected_at)}</span>
                    <span>Board: {task.board_id?.title || "Unknown"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AtRiskTasks;

