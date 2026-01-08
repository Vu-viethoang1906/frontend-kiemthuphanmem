import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getSprintForecast } from "../../api/sprintForecastApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Users,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  Info,
  BarChart3,
} from "lucide-react";

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

interface SprintForecastData {
  board_id: string;
  next_sprint: {
    start_date: string;
    end_date: string;
    duration_days: number;
  };
  historical_velocity: {
    average: number;
    from_sprints: number;
    period: {
      start: string;
      end: string;
    };
  };
  confidence_interval: {
    min: number;
    max: number;
    percentage: string;
  };
  risk_factors: {
    users_on_leave: number;
    on_leave_percentage: number;
    on_leave_risk_factor: number;
    holidays_count: number;
    holidays_percentage: number;
    holidays_risk_factor: number;
    current_wip: number;
    wip_risk_factor: number;
    total_risk_adjustment: number;
  };
  recommendation: {
    recommended_task_count: number;
    confidence_level: "high" | "medium" | "low";
    notes: string[];
  };
}

const WorkForecast: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [forecastData, setForecastData] = useState<SprintForecastData | null>(null);
  const [nextSprintStart, setNextSprintStart] = useState<string>("");
  const [nextSprintEnd, setNextSprintEnd] = useState<string>("");
  const [sprintDurationDays, setSprintDurationDays] = useState<number>(14);

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

  // Load forecast data
  const loadForecast = async () => {
    if (!selectedBoardId) {
      console.error("Please select a board");
      return;
    }

    setDataLoading(true);
    try {
      const params: any = {};
      if (nextSprintStart) params.next_sprint_start = nextSprintStart;
      if (nextSprintEnd) params.next_sprint_end = nextSprintEnd;
      if (sprintDurationDays) params.sprint_duration_days = sprintDurationDays;

      const response = await getSprintForecast(
        selectedBoardId,
        nextSprintStart || undefined,
        nextSprintEnd || undefined,
        sprintDurationDays || undefined
      );

      if (response.success && response.data) {
        setForecastData(response.data);
        // Auto-set dates if not provided
        if (!nextSprintStart && response.data.next_sprint.start_date) {
          setNextSprintStart(response.data.next_sprint.start_date.split("T")[0]);
        }
        if (!nextSprintEnd && response.data.next_sprint.end_date) {
          setNextSprintEnd(response.data.next_sprint.end_date.split("T")[0]);
        }
      } else {
        console.error("Unable to load forecast data");
      }
    } catch (error: any) {
      console.error("Error loading forecast:", error);
      console.error(error.response?.data?.message || "Unable to load forecast data");
    } finally {
      setDataLoading(false);
    }
  };

  // Auto-load when board is selected
  useEffect(() => {
    if (selectedBoardId && !loading) {
      loadForecast();
    }
  }, [selectedBoardId]);

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    setSearchParams({ board: boardId });
    setForecastData(null);
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "medium":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getConfidenceIcon = (level: string) => {
    switch (level) {
      case "high":
        return <CheckCircle2 className="w-5 h-5" />;
      case "medium":
        return <AlertTriangle className="w-5 h-5" />;
      case "low":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const translateForecastNote = (note: string) => {
    if (!note) return note;
    const map: Record<string, string> = {
      "Có 4 ngày nghỉ lễ trong sprint, cần điều chỉnh kỳ vọng":
        "There are 4 holidays during the sprint; adjust expectations accordingly.",
      "WIP hiện tại": "Current WIP",
      "cao hơn velocity": "is higher than velocity",
      "nên hoàn thành task hiện có trước khi nhận thêm":
        "consider finishing current tasks before taking new ones",
    };

    // Exact match first
    if (map[note]) return map[note];

    // Partial matches
    if (note.includes("Có") && note.includes("nghỉ")) {
      return "There are holidays during the sprint; adjust expectations accordingly.";
    }
    if (note.includes("WIP hiện tại") && note.includes("velocity")) {
      // attempt to extract numbers
      const numMatch = note.match(/\((\d+)\)/);
      const num = numMatch ? numMatch[1] : null;
      return num
        ? `Current WIP (${num}) is higher than velocity; consider finishing current tasks before taking new ones.`
        : `Current WIP is higher than velocity; consider finishing current tasks before taking new ones.`;
    }

    return note;
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Work Forecast
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Forecast of how many tasks can be completed in the next sprint based on historical velocity
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 mb-1.5 border border-gray-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Select Board
            </label>
            <select
              value={selectedBoardId}
              onChange={(e) => handleBoardChange(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={dataLoading}
            >
              <option value="">-- Select Board --</option>
              {boards.map((board) => (
                <option key={board._id || board.id} value={board._id || board.id}>
                  {board.title || board.name || "Untitled Board"}
                </option>
              ))}
            </select>
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Sprint Start Date
            </label>
            <input
              type="date"
              value={nextSprintStart}
              onChange={(e) => setNextSprintStart(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={dataLoading}
            />
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Sprint End Date
            </label>
            <input
              type="date"
              value={nextSprintEnd}
              onChange={(e) => setNextSprintEnd(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={dataLoading}
            />
          </div>

          <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Sprint Duration (days)
            </label>
            <input
              type="number"
              value={sprintDurationDays}
              onChange={(e) => setSprintDurationDays(parseInt(e.target.value) || 14)}
              min={1}
              max={30}
              className="w-full px-4 py-2 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              disabled={dataLoading}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadForecast}
              disabled={dataLoading || !selectedBoardId}
              className="w-full px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {dataLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              Load Forecast
            </button>
          </div>
        </div>
      </div>

      {dataLoading && !forecastData ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : forecastData ? (
        <div className="space-y-[2px]">
          {/* Next Sprint Info */}
          <div className="bg-white dark:bg-slate-800 p-6 border-l-4 border-indigo-500 border border-gray-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Next Sprint
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(forecastData.next_sprint.start_date).toLocaleDateString("en-US")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {new Date(forecastData.next_sprint.end_date).toLocaleDateString("en-US")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {forecastData.next_sprint.duration_days} days
                </p>
              </div>
            </div>
          </div>

          {/* Historical Velocity */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Historical Velocity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Velocity</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {forecastData.historical_velocity.average}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  tasks/sprint
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">From {forecastData.historical_velocity.from_sprints} sprints</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  {new Date(forecastData.historical_velocity.period.start).toLocaleDateString("en-US")} - {new Date(forecastData.historical_velocity.period.end).toLocaleDateString("en-US")}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Confidence Interval</p>
                <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  {forecastData.confidence_interval.min} - {forecastData.confidence_interval.max}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ({forecastData.confidence_interval.percentage})
                </p>
              </div>
            </div>
          </div>

          {/* Risk Factors */}
          <div className="bg-white dark:bg-slate-800 p-6 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Factors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Users On Leave
                  </p>
                  <span className="text-xs bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">
                    {forecastData.risk_factors.on_leave_percentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {forecastData.risk_factors.users_on_leave}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Risk factor: {forecastData.risk_factors.on_leave_risk_factor.toFixed(3)}
                </p>
              </div>

              <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Holidays
                  </p>
                  <span className="text-xs bg-orange-200 dark:bg-orange-800 px-2 py-1 rounded">
                    {forecastData.risk_factors.holidays_percentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {forecastData.risk_factors.holidays_count}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Risk factor: {forecastData.risk_factors.holidays_risk_factor.toFixed(3)}
                </p>
              </div>

              <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Current WIP
                  </p>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {forecastData.risk_factors.current_wip}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Risk factor: {forecastData.risk_factors.wip_risk_factor.toFixed(3)}
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Risk Adjustment: <span className="font-semibold text-gray-900 dark:text-white">{forecastData.risk_factors.total_risk_adjustment.toFixed(3)}</span>
              </p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white dark:bg-slate-800 p-6 border-l-4 border-green-500 border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recommendation
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 mb-4 ${getConfidenceColor(forecastData.recommendation.confidence_level)}`}>
                  {getConfidenceIcon(forecastData.recommendation.confidence_level)}
                  <span className="font-semibold">
                    Confidence: {forecastData.recommendation.confidence_level.toUpperCase()}
                  </span>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Recommended Task Count</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {forecastData.recommendation.recommended_task_count}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    tasks to assign for the next sprint
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Notes:</p>
                <ul className="space-y-2">
                    {forecastData.recommendation.notes.map((note, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-500" />
                        <span>{translateForecastNote(note)}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-12 text-center border border-gray-200 dark:border-slate-700">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Please select a board and click "Load Forecast" to view the forecast
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkForecast;

