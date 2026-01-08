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
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { getThroughputAndCFD } from "../../api/analyticsApi";
import { fetchMyBoards } from "../../api/boardApi";
import toast from "react-hot-toast";
import {
  Loader2,
  TrendingUp,
  Clock,
  ArrowRightLeft,
  AlertTriangle,
  BarChart3,
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
  Filler,
  ArcElement
);

interface Board {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
}

interface ColumnFlow {
  entered: number;
  exited: number;
}

interface ThroughputData {
  columnFlow: Record<string, ColumnFlow>;
  columnAvgTimes: Record<string, number>;
  cfd: Array<{
    date: string;
    [columnName: string]: string | number;
  }>;
  wipViolations: Record<string, Array<{ date: string; count: number }>>;
}

const Throughput: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [throughputData, setThroughputData] = useState<ThroughputData | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [wipLimit, setWipLimit] = useState(5);
  const [activeSection, setActiveSection] = useState<
    "task-flow" | "average" | "cfd" | "stats"
  >("task-flow");

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

  // Load throughput data
  useEffect(() => {
    const loadThroughputData = async () => {
      if (!selectedBoardId) return;

      try {
        setDataLoading(true);
        const response = await getThroughputAndCFD({
          boardId: selectedBoardId,
          startDate: dateRange.start,
          endDate: dateRange.end,
          wipLimit,
        });
        
        if (response?.success && response?.data) {
          setThroughputData(response.data);
        } else {
          toast.error("Failed to load throughput data");
        }
      } catch (error: any) {
        console.error("Error loading throughput data:", error);
        toast.error(error?.response?.data?.message || "Failed to load throughput data");
      } finally {
        setDataLoading(false);
      }
    };

    loadThroughputData();
  }, [selectedBoardId, dateRange.start, dateRange.end, wipLimit]);

  const updateURL = (boardId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("board", boardId);
    setSearchParams(newParams);
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoardId(boardId);
    updateURL(boardId);
  };

  // Prepare column flow chart data
  const getColumnFlowChartData = () => {
    if (!throughputData?.columnFlow) return null;

    const columns = Object.keys(throughputData.columnFlow);
    const entered = columns.map((col) => throughputData.columnFlow[col].entered);
    const exited = columns.map((col) => throughputData.columnFlow[col].exited);

    return {
      labels: columns,
      datasets: [
        {
          label: "Entered",
          data: entered,
          backgroundColor: "rgba(59, 130, 246, 0.5)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
        },
        {
          label: "Exited",
          data: exited,
          backgroundColor: "rgba(16, 185, 129, 0.5)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare average time chart data
  const getAverageTimeChartData = () => {
    if (!throughputData?.columnAvgTimes) return null;

    const columns = Object.keys(throughputData.columnAvgTimes);
    const avgTimes = columns.map((col) => throughputData.columnAvgTimes[col]);

    return {
      labels: columns,
      datasets: [
        {
          label: "Average Time (hours)",
          data: avgTimes,
          backgroundColor: "rgba(139, 92, 246, 0.5)",
          borderColor: "rgba(139, 92, 246, 1)",
          borderWidth: 2,
        },
      ],
    };
  };

  // Prepare CFD chart data - Stacked Area Chart
  const getCFDChartData = () => {
    if (!throughputData?.cfd || throughputData.cfd.length === 0) return null;

    const dates = throughputData.cfd.map((item) => {
      const date = new Date(item.date);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    // Get all column names from first CFD entry
    const firstEntry = throughputData.cfd[0];
    const columnNames = Object.keys(firstEntry).filter((key) => key !== "date");

    // Use more vibrant and distinct colors for better visibility
    const colorPalette = [
      { bg: "rgba(59, 130, 246, 0.7)", border: "rgba(59, 130, 246, 1)" }, // Blue
      { bg: "rgba(16, 185, 129, 0.7)", border: "rgba(16, 185, 129, 1)" }, // Green
      { bg: "rgba(245, 158, 11, 0.7)", border: "rgba(245, 158, 11, 1)" }, // Amber
      { bg: "rgba(239, 68, 68, 0.7)", border: "rgba(239, 68, 68, 1)" }, // Red
      { bg: "rgba(139, 92, 246, 0.7)", border: "rgba(139, 92, 246, 1)" }, // Purple
      { bg: "rgba(236, 72, 153, 0.7)", border: "rgba(236, 72, 153, 1)" }, // Pink
      { bg: "rgba(34, 197, 94, 0.7)", border: "rgba(34, 197, 94, 1)" }, // Emerald
      { bg: "rgba(249, 115, 22, 0.7)", border: "rgba(249, 115, 22, 1)" }, // Orange
    ];

    const datasets = columnNames.map((col, index) => {
      const color = colorPalette[index % colorPalette.length];
      
      return {
        label: col,
        data: throughputData.cfd.map((item) => item[col] as number),
        backgroundColor: color.bg,
        borderColor: color.border,
        borderWidth: 1.5,
        fill: true,
        tension: 0.4, // Smooth curves
        pointRadius: 0, // Hide points for cleaner look
        pointHoverRadius: 4,
      };
    });

    return {
      labels: dates,
      datasets,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index' as const,
          intersect: false,
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false,
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
        },
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            mode: 'index' as const,
            intersect: false,
            callbacks: {
              label: function(context: any) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y + ' tasks';
                return label;
              }
            }
          },
        },
      },
    };
  };

  // Find slowest column
  const getSlowestColumn = () => {
    if (!throughputData?.columnAvgTimes) return null;

    const entries = Object.entries(throughputData.columnAvgTimes);
    if (entries.length === 0) return null;

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return {
      column: sorted[0][0],
      avgTime: sorted[0][1],
    };
  };

  // Find fastest column
  const getFastestColumn = () => {
    if (!throughputData?.columnAvgTimes) return null;

    const entries = Object.entries(throughputData.columnAvgTimes);
    if (entries.length === 0) return null;

    const sorted = entries.sort((a, b) => a[1] - b[1]).filter(([_, time]) => time > 0);
    return sorted.length > 0 ? {
      column: sorted[0][0],
      avgTime: sorted[0][1],
    } : null;
  };

  // Calculate total throughput
  const getTotalThroughput = () => {
    if (!throughputData?.columnFlow) return { entered: 0, exited: 0 };
    
    const total = Object.values(throughputData.columnFlow).reduce(
      (acc, flow) => ({
        entered: acc.entered + flow.entered,
        exited: acc.exited + flow.exited,
      }),
      { entered: 0, exited: 0 }
    );
    return total;
  };

  // Find bottleneck (column with largest difference between entered and exited)
  const getBottleneck = () => {
    if (!throughputData?.columnFlow) return null;

    const entries = Object.entries(throughputData.columnFlow);
    if (entries.length === 0) return null;

    const bottlenecks = entries
      .map(([col, flow]) => ({
        column: col,
        difference: flow.entered - flow.exited,
        entered: flow.entered,
        exited: flow.exited,
      }))
      .filter((b) => b.difference > 0)
      .sort((a, b) => b.difference - a.difference);

    return bottlenecks.length > 0 ? bottlenecks[0] : null;
  };

  // Calculate average cycle time across all columns
  const getAverageCycleTime = () => {
    if (!throughputData?.columnAvgTimes) return 0;
    
    const times = Object.values(throughputData.columnAvgTimes).filter(t => t > 0);
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  };

  // Get throughput statistics by period
  const getThroughputByPeriod = () => {
    if (!throughputData?.cfd || throughputData.cfd.length === 0) return [];
    
    const periods = [];
    for (let i = 0; i < throughputData.cfd.length; i++) {
      const current = throughputData.cfd[i];
      const previous = i > 0 ? throughputData.cfd[i - 1] : null;
      
      const date = new Date(current.date);
      const columnNames = Object.keys(current).filter(key => key !== 'date');
      
      const periodData: any = {
        date: date.toLocaleDateString('en-US'),
        columns: {},
        total: 0,
        changes: {},
      };
      
      columnNames.forEach(col => {
        const count = current[col] as number;
        periodData.columns[col] = count;
        periodData.total += count;
        
        if (previous) {
          const prevCount = (previous[col] as number) || 0;
          periodData.changes[col] = count - prevCount;
        } else {
          periodData.changes[col] = count;
        }
      });
      
      periods.push(periodData);
    }
    
    return periods;
  };

  // Get top columns by various metrics
  const getTopColumns = () => {
    if (!throughputData?.columnFlow) return null;
    
    const entries = Object.entries(throughputData.columnFlow);
    
    const topByEntered = [...entries]
      .sort((a, b) => b[1].entered - a[1].entered)
      .slice(0, 5)
      .map(([col, flow]) => ({ column: col, value: flow.entered, type: 'entered' }));
    
    const topByExited = [...entries]
      .sort((a, b) => b[1].exited - a[1].exited)
      .slice(0, 5)
      .map(([col, flow]) => ({ column: col, value: flow.exited, type: 'exited' }));
    
    const topByBacklog = [...entries]
      .map(([col, flow]) => ({ column: col, value: flow.entered - flow.exited }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(item => ({ ...item, type: 'backlog' }));
    
    const topByTime = Object.entries(throughputData.columnAvgTimes || {})
      .map(([col, time]) => ({ column: col, value: time }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(item => ({ ...item, type: 'time' }));
    
    return {
      byEntered: topByEntered,
      byExited: topByExited,
      byBacklog: topByBacklog,
      byTime: topByTime,
    };
  };

  const slowestColumn = getSlowestColumn();
  const fastestColumn = getFastestColumn();
  const bottleneck = getBottleneck();
  const totalThroughput = getTotalThroughput();
  const throughputByPeriod = getThroughputByPeriod();
  const topColumns = getTopColumns();
  const avgCycleTime = getAverageCycleTime();
  const throughputTrendData = () => {
    if (!throughputByPeriod.length) return null;
    return {
      labels: throughputByPeriod.map((p) => p.date),
      datasets: [
        {
          label: "Total tasks",
          data: throughputByPeriod.map((p) => p.total),
          borderColor: "rgb(251, 191, 36)",
          backgroundColor: "rgba(251, 191, 36, 0.2)",
          tension: 0.35,
          pointRadius: 3,
        },
      ],
    };
  };
  const totalDays = throughputByPeriod.length;
  const maxDaily = throughputByPeriod.reduce((max, p) => Math.max(max, p.total), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-slate-900 min-h-screen">
      <div>
        {/* Hero card with tabs */}
        <div className="bg-white dark:bg-slate-800 mb-[2px] border border-gray-200 dark:border-slate-700">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Throughput Analysis
              </p>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chọn nhóm phân tích bên dưới để xem dữ liệu tương ứng.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Board</span>
                <select
                  value={selectedBoardId}
                  onChange={(e) => handleBoardChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  disabled={dataLoading}
                >
                  {boards.map((board) => (
                    <option key={board._id || board.id} value={board._id || board.id}>
                      {board.title || board.name || "Untitled Board"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  disabled={dataLoading}
                />
                <span className="text-gray-500 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  disabled={dataLoading}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap divide-x divide-gray-100 dark:divide-slate-700">
            {[
              { key: "task-flow", title: "Task Flow", desc: "Entered vs Exited & bảng cột" },
              { key: "average", title: "Average", desc: "Thời gian trung bình từng cột" },
              { key: "cfd", title: "Cumulative Flow Diagram", desc: "Luồng tích lũy theo ngày" },
              { key: "stats", title: "Column Statistics", desc: "Thống kê chi tiết & top cột" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveSection(item.key as typeof activeSection)}
                className={`flex-1 min-w-[180px] text-left px-5 py-4 transition ${
                  activeSection === item.key
                    ? "bg-blue-50 dark:bg-slate-700/40 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500"
                    : "bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/30"
                }`}
              >
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</div>
              </button>
            ))}
          </div>
          <div className="px-5 py-4 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Total Duration</span>
              <span className="font-semibold">{totalDays} day(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">Max throughput/day</span>
              <span className="font-semibold">{maxDaily}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">WIP Limit</span>
              <input
                type="number"
                min="1"
                value={wipLimit}
                onChange={(e) => setWipLimit(parseInt(e.target.value) || 5)}
                className="w-20 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                disabled={dataLoading}
              />
            </div>
          </div>
        </div>

        {dataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : !throughputData ? (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No data available. Please select a board with task history.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Text Description */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 mb-[2px]">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                📈 Data Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[2px] text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <p className="mb-2">
                    <strong>Analysis period:</strong> From {new Date(dateRange.start).toLocaleDateString('en-US')} to {new Date(dateRange.end).toLocaleDateString('en-US')}
                  </p>
                  <p className="mb-2">
                    <strong>Total items started:</strong> <span className="font-semibold text-blue-600 dark:text-blue-400">{totalThroughput.entered}</span> tasks
                  </p>
                  <p className="mb-2">
                    <strong>Total tasks exited:</strong> <span className="font-semibold text-green-600 dark:text-green-400">{totalThroughput.exited}</span> tasks
                  </p>
                  <p>
                    <strong>Backlog:</strong> <span className={`font-semibold ${(totalThroughput.entered - totalThroughput.exited) > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {totalThroughput.entered - totalThroughput.exited > 0 ? '+' : ''}{totalThroughput.entered - totalThroughput.exited}
                    </span> tasks
                  </p>
                </div>
                <div>
                  <p className="mb-2">
                    <strong>Average cycle time:</strong> <span className="font-semibold text-purple-600 dark:text-purple-400">{avgCycleTime.toFixed(1)}</span> hrs ({(avgCycleTime / 24).toFixed(1)} days)
                  </p>
                  <p className="mb-2">
                    <strong>Completion rate:</strong> <span className={`font-semibold ${totalThroughput.entered > 0 && (totalThroughput.exited / totalThroughput.entered) >= 0.8 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {totalThroughput.entered > 0 ? ((totalThroughput.exited / totalThroughput.entered) * 100).toFixed(1) : 0}%
                    </span> ({totalThroughput.exited}/{totalThroughput.entered} tasks)
                  </p>
                  {slowestColumn && (
                    <p className="mb-2">
                      <strong>Slowest column:</strong> <span className="font-semibold text-orange-600 dark:text-orange-400">{slowestColumn.column}</span> with average {(slowestColumn.avgTime / 24).toFixed(1)} days
                    </p>
                  )}
                  {bottleneck && bottleneck.difference > 0 && (
                    <p>
                      <strong>Bottleneck:</strong> Column <span className="font-semibold text-orange-600 dark:text-orange-400">{bottleneck.column}</span> has {bottleneck.difference} backlog tasks
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-[2px] mb-[2px]">
              {/* Total Flow Entered */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Tasks Entered
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalThroughput.entered}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              {/* Total Flow Exited */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Tasks Exited
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalThroughput.exited}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 dark:bg-green-900">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>

              {/* Average Time */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Avg Cycle Time
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {avgCycleTime.toFixed(1)}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                        hrs
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {(avgCycleTime / 24).toFixed(1)} days
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900">
                    <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Completion Rate
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalThroughput.entered > 0
                        ? ((totalThroughput.exited / totalThroughput.entered) * 100).toFixed(1)
                        : "0"}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                        %
                      </span>
                    </p>
                  </div>
                  <div className={`p-3 ${
                    totalThroughput.entered > 0 && (totalThroughput.exited / totalThroughput.entered) >= 0.8
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-orange-100 dark:bg-orange-900"
                  }`}>
                    <BarChart3 className={`w-6 h-6 ${
                      totalThroughput.entered > 0 && (totalThroughput.exited / totalThroughput.entered) >= 0.8
                        ? "text-green-600 dark:text-green-400"
                        : "text-orange-600 dark:text-orange-400"
                    }`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section content driven by tabs */}
            {activeSection === "task-flow" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px] mb-[2px]">
                {getColumnFlowChartData() && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Task Flow (Entered vs Exited)
                      </h2>
                    </div>
                    <Bar data={getColumnFlowChartData()!} />
                  </div>
                )}

                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      📊 Task Flow Data By Column
                    </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-700">
                          <th className="py-2 px-3 text-left font-semibold text-gray-700 dark:text-gray-300">Column</th>
                          <th className="py-2 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">Entered</th>
                          <th className="py-2 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">Exited</th>
                          <th className="py-2 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">Backlog</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(throughputData.columnFlow || {})
                          .sort((a, b) => (b[1].entered - b[1].exited) - (a[1].entered - a[1].exited))
                          .map(([column, flow]) => {
                            const backlog = flow.entered - flow.exited;
                            return (
                              <tr key={column} className="border-b border-gray-100 dark:border-slate-700">
                                <td className="py-2 px-3 text-gray-900 dark:text-white">{column}</td>
                                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">{flow.entered}</td>
                                <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">{flow.exited}</td>
                                <td className={`py-2 px-3 text-right font-medium ${
                                  backlog > 0 ? 'text-orange-600 dark:text-orange-400' : 
                                  backlog < 0 ? 'text-green-600 dark:text-green-400' : 
                                  'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {backlog > 0 ? `+${backlog}` : backlog}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 dark:border-slate-600 font-semibold">
                          <td className="py-2 px-3 text-gray-900 dark:text-white">Total</td>
                          <td className="py-2 px-3 text-right text-gray-900 dark:text-white">{totalThroughput.entered}</td>
                          <td className="py-2 px-3 text-right text-gray-900 dark:text-white">{totalThroughput.exited}</td>
                          <td className="py-2 px-3 text-right text-gray-900 dark:text-white">
                            {totalThroughput.entered - totalThroughput.exited}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "average" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[2px] mb-[2px]">
                {getAverageTimeChartData() && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Average Time in Each Column
                      </h2>
                    </div>
                    <Bar data={getAverageTimeChartData()!} />
                  </div>
                )}

                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    ⏱️ Average Time Per Column
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-700">
                          <th className="py-2 px-3 text-left font-semibold text-gray-700 dark:text-gray-300">Column</th>
                          <th className="py-2 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">Hours</th>
                          <th className="py-2 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(throughputData.columnAvgTimes || {})
                          .sort((a, b) => b[1] - a[1])
                          .map(([column, time]) => (
                            <tr key={column} className="border-b border-gray-100 dark:border-slate-700">
                              <td className="py-2 px-3 text-gray-900 dark:text-white">{column}</td>
                              <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                                {time.toFixed(2)} hrs
                              </td>
                              <td className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                                {(time / 24).toFixed(2)} days
                              </td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 dark:border-slate-600 font-semibold">
                          <td className="py-2 px-3 text-gray-900 dark:text-white">Average</td>
                          <td className="py-2 px-3 text-right text-gray-900 dark:text-white">
                            {avgCycleTime.toFixed(2)} hrs
                          </td>
                          <td className="py-2 px-3 text-right text-gray-900 dark:text-white">
                            {(avgCycleTime / 24).toFixed(2)} days
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "cfd" && getCFDChartData() && (
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 mb-[2px]">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Cumulative Flow Diagram (CFD) - Stacked Area Chart
                  </h2>
                </div>
                <div className="h-96">
                  <Line 
                    data={{
                      labels: getCFDChartData()!.labels,
                      datasets: getCFDChartData()!.datasets,
                    }} 
                    options={getCFDChartData()!.options} 
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  💡 Biểu đồ cho thấy số lượng công việc tích lũy ở từng cột theo thời gian.
                </p>
              </div>
            )}

            {activeSection === "stats" && (
              <>
                {topColumns && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] mb-[2px]">
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        🔝 Top Columns - Entered
                      </h3>
                      <div className="space-y-2">
                        {topColumns.byEntered.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                              {idx + 1}. {item.column}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        🔝 Top Columns - Exited
                      </h3>
                      <div className="space-y-2">
                        {topColumns.byExited.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                              {idx + 1}. {item.column}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        ⚠️ Top Columns - Backlog
                      </h3>
                      <div className="space-y-2">
                        {topColumns.byBacklog.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                              {idx + 1}. {item.column}
                            </span>
                            <span className={`text-sm font-semibold ml-2 ${
                              item.value > 0 ? 'text-orange-600 dark:text-orange-400' : 
                              'text-gray-900 dark:text-white'
                            }`}>
                              {item.value > 0 ? `+${item.value}` : item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        ⏱️ Top Columns - Time
                      </h3>
                      <div className="space-y-2">
                        {topColumns.byTime.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                              {idx + 1}. {item.column}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2">
                              {(item.value / 24).toFixed(1)}d
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {throughputByPeriod.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 mb-[2px]">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      📅 Throughput Over Time
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-slate-700">
                            <th className="py-2 px-3 text-left font-semibold text-gray-700 dark:text-gray-300">Date</th>
                            {Object.keys(throughputByPeriod[0]?.columns || {}).map(col => (
                              <th key={col} className="py-2 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                                {col}
                              </th>
                            ))}
                            <th className="py-2 px-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {throughputByPeriod.slice(-10).map((period, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-slate-700">
                              <td className="py-2 px-3 text-gray-900 dark:text-white">{period.date}</td>
                              {Object.entries(period.columns).map(([col, count]) => (
                                <td key={col} className="py-2 px-3 text-right text-gray-600 dark:text-gray-400">
                                  {count as number}
                                </td>
                              ))}
                              <td className="py-2 px-3 text-right font-medium text-gray-900 dark:text-white">
                                {period.total}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Showing last 10 days. Total days: {throughputByPeriod.length}
                    </p>
                  </div>
                )}

                {throughputData.wipViolations &&
                  Object.keys(throughputData.wipViolations).length > 0 && (
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6 mb-[2px]">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                          WIP Violations
                        </h2>
                      </div>
                      <div className="space-y-4">
                        {Object.entries(throughputData.wipViolations).map(
                          ([column, violations]) => (
                            <div
                              key={column}
                              className="border border-orange-200 dark:border-orange-800 p-4 bg-orange-50 dark:bg-orange-900/20"
                            >
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                {column}
                              </h3>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {violations.length} violation(s) detected
                              </div>
                              <div className="mt-2 space-y-1">
                                {violations.slice(0, 5).map((violation, idx) => (
                                  <div
                                    key={idx}
                                    className="text-xs text-gray-500 dark:text-gray-500"
                                  >
                                    {new Date(violation.date).toLocaleDateString("en-US")}:{" "}
                                    {violation.count} tasks
                                  </div>
                                ))}
                                {violations.length > 5 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    ... and {violations.length - 5} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Column Statistics
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-700">
                          <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Column
                          </th>
                          <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Entered
                          </th>
                          <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Exited
                          </th>
                          <th className="py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Avg Time (hrs)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(throughputData.columnFlow || {}).map(
                          ([column, flow]) => (
                            <tr
                              key={column}
                              className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                              <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                                {column}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                {flow.entered}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                {flow.exited}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                                {(
                                  throughputData.columnAvgTimes[column] || 0
                                ).toFixed(2)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Throughput;

