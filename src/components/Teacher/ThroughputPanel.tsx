import React, { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { getThroughputAndCFD } from '../../api/analyticsApi';
import { fetchMyBoards } from '../../api/boardApi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type ColumnFlow = {
  [column: string]: {
    entered: number;
    exited: number;
  };
};

type ColumnAvgTimes = {
  [column: string]: number;
};

type CfdPoint = {
  date: string | Date;
  [column: string]: number | string | Date;
};

type WipViolations = {
  [column: string]: { date: string | Date; count: number }[];
};

interface ThroughputResponse {
  columnFlow: ColumnFlow;
  columnAvgTimes: ColumnAvgTimes;
  cfd: CfdPoint[];
  wipViolations: WipViolations;
}

const ThroughputPanel: React.FC = () => {
  const [boardId, setBoardId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ThroughputResponse | null>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [loadingBoards, setLoadingBoards] = useState<boolean>(false);

  useEffect(() => {
    const loadBoards = async () => {
      try {
        setLoadingBoards(true);
        const res = await fetchMyBoards({
          page: 1,
          limit: 50,
          sortBy: 'created_at',
          sortOrder: 'desc',
        });
        // Handle different response structures
        let boardsData: any[] = [];
        if (res?.data) {
          boardsData = Array.isArray(res.data) ? res.data : [];
        } else if (Array.isArray(res)) {
          boardsData = res;
        }
        setBoards(boardsData);
      } catch {
        setBoards([]);
      } finally {
        setLoadingBoards(false);
      }
    };

    loadBoards();
  }, []);

  const handleLoad = async () => {
    if (!boardId) {
      setError('Please select a Board');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await getThroughputAndCFD({
        boardId: boardId,
      });
      const payload = res?.data ?? res;
      setData(payload ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    if (!data) return [] as string[];
    return Object.keys(data.columnFlow || {});
  }, [data]);

  const cfdTable = useMemo(() => {
    if (!data || !data.cfd || !data.cfd.length || !columns.length) return [];

    // Sort by date in descending order (newest first) and take the first 7 entries
    const sortedCfd = [...data.cfd]
      .sort((a, b) => {
        const dateA = new Date(b.date as string | Date).getTime();
        const dateB = new Date(a.date as string | Date).getTime();
        return dateA - dateB;
      })
      .slice(0, 7);

    return sortedCfd
      .map((point) => {
        const date = new Date(point.date as string | Date);
        const dateLabel = date.toISOString().split('T')[0];
        const counts: Record<string, number> = {};
        columns.forEach((col) => {
          const raw = point[col];
          counts[col] = typeof raw === 'number' ? raw : 0;
        });
        return { dateLabel, counts };
      })
      .reverse(); // Reverse to show oldest to newest in the table
  }, [data, columns]);

  const cfdChart = useMemo(() => {
    if (!cfdTable.length || !columns.length) {
      return { data: null, options: null };
    }

    const labels = cfdTable.map((row) => row.dateLabel);

    const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#22c55e'];

    const datasets = columns.map((col, index) => {
      const color = palette[index % palette.length];
      return {
        label: col,
        data: cfdTable.map((row) => row.counts[col] ?? 0),
        borderColor: color,
        backgroundColor: `${color}33`,
        fill: index === 0 ? 'origin' : '-1',
        tension: 0.25,
        pointRadius: 2,
        pointHitRadius: 8,
        borderWidth: 2,
        stack: 'cfd',
      };
    });

    const chartData = {
      labels,
      datasets,
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const label = ctx.dataset?.label || '';
              const value = ctx.parsed?.y ?? 0;
              return `${label}: ${value} task(s)`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    };

    return { data: chartData, options: chartOptions };
  }, [cfdTable, columns]);

  const bottlenecks = useMemo(() => {
    if (!data) return [] as { column: string; hours: number }[];
    const entries = Object.entries(data.columnAvgTimes || {})
      .map(([column, hours]) => ({ column, hours }))
      .sort((a, b) => b.hours - a.hours);
    return entries;
  }, [data]);

  return (
    <div className="p-6 text-[color:var(--text-primary)]">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-[color:var(--border-color)] pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Throughput & Bottlenecks</h2>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
            <div className="flex flex-col sm:items-start">
              <span className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Select board
              </span>
              <select
                className="w-full rounded-none border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 sm:w-64"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
              >
                <option value="" disabled>
                  {loadingBoards ? 'Loading boards...' : 'Select a board to view'}
                </option>
                {boards.map((board) => {
                  const id = board._id || board.id;
                  const title = board.title || '(Untitled)';
                  return (
                    <option key={id} value={id}>
                      {title}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!boardId || loading}
              onClick={handleLoad}
            >
              {loading ? 'Loading...' : 'Load data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Columns in workflow
            </div>
            <div className="mt-1 text-2xl font-semibold">{columns.length}</div>
          </div>
          <div className="border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              CFD days
            </div>
            <div className="mt-1 text-2xl font-semibold">{data?.cfd?.length ?? 0}</div>
          </div>
          <div className="border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Potential bottleneck columns
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {bottlenecks.length
                ? bottlenecks
                    .slice(0, 2)
                    .map((b) => b.column)
                    .join(', ')
                : 'No data yet'}
            </div>
          </div>
        </div>

        {/* Workflow throughput by column */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">
            Workflow throughput by column
            <span className="sr-only"> (Lưu lượng công việc qua từng cột)</span>
          </h3>
          <div className="overflow-x-auto border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60">
            <table className="min-w-full text-sm">
              <thead className="border-b border-[color:var(--border-color)] bg-gray-50/80 text-left text-gray-700 dark:bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 font-medium">Column</th>
                  <th className="px-4 py-2 font-medium">Entered</th>
                  <th className="px-4 py-2 font-medium">Exited</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => {
                  const flow = data?.columnFlow?.[col] || { entered: 0, exited: 0 };
                  return (
                    <tr
                      key={col}
                      className="border-t border-[color:var(--border-color)] hover:bg-gray-50/70 dark:hover:bg-gray-800/60"
                    >
                      <td className="px-4 py-2 text-sm font-medium">{col}</td>
                      <td className="px-4 py-2 text-sm">{flow.entered}</td>
                      <td className="px-4 py-2 text-sm">{flow.exited}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Average time per column */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Average time per column (hours)</h3>
          <div className="space-y-2">
            {bottlenecks.map((b) => {
              const width = Math.min(Math.abs(b.hours) * 4 + 24, 480);
              return (
                <div key={b.column} className="flex items-center gap-4">
                  <div className="w-48 truncate text-sm font-medium">{b.column}</div>
                  <div className="flex flex-1 items-center gap-3">
                    <div
                      className="flex-1 overflow-hidden border border-[color:var(--border-color)] bg-gray-100 dark:bg-gray-800"
                      aria-hidden
                    >
                      <div
                        style={{ width: `${width}px` }}
                        className="h-3 bg-blue-600"
                        title={`${b.hours.toFixed(2)} average hours`}
                      />
                    </div>
                    <div className="w-20 min-w-[80px] text-sm font-semibold">
                      {b.hours.toFixed(2)}h
                    </div>
                  </div>
                </div>
              );
            })}
            {!bottlenecks.length && (
              <div className="text-sm text-gray-500">No column time data available.</div>
            )}
          </div>
        </div>

        {/* WIP violations */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">
            WIP Alerts (Work In Progress)
            <span className="sr-only"> (Cảnh báo WIP)</span>
          </h3>
          {data && Object.keys(data.wipViolations || {}).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(data.wipViolations).map(([col, list]) => (
                <div
                  key={col}
                  className="border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 px-4 py-3 text-sm"
                >
                  <div className="mb-1 font-medium">{col}</div>
                  <div className="text-xs text-gray-500 mb-1">WIP breaches: {list.length}</div>
                  <div className="flex flex-wrap gap-2">
                    {list.slice(0, 5).map((v, idx) => {
                      const d = new Date(v.date as string | Date).toISOString().split('T')[0];
                      return (
                        <span
                          key={idx}
                          className="border border-red-300 bg-red-50 px-2 py-0.5 text-xs text-red-700"
                        >
                          {d}: {v.count} tasks
                        </span>
                      );
                    })}
                    {list.length > 5 && (
                      <span className="text-xs text-gray-500">+{list.length - 5} more...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              No WIP violations recorded in the current data.
            </div>
          )}
        </div>

        {/* CFD table */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Cumulative Flow over time</h3>
          {cfdChart.data && cfdChart.options && (
            <div className="h-64 border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 px-4 py-3">
              <div className="mb-2 text-xs text-gray-500">
                Each colored area represents the number of tasks in each column per day (CFD).
              </div>
              <div className="h-52">
                <Line data={cfdChart.data} options={cfdChart.options} />
              </div>
            </div>
          )}
          <div className="overflow-x-auto border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60">
            <table className="min-w-full table-fixed text-sm">
              <thead className="border-b border-[color:var(--border-color)] bg-gray-50/80 text-center text-gray-700 dark:bg-gray-800/60">
                <tr>
                  <th className="px-4 py-2 font-medium whitespace-nowrap">Date</th>
                  {columns.map((col) => (
                    <th key={col} className="px-4 py-2 font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cfdTable.map((row) => (
                  <tr
                    key={row.dateLabel}
                    className="border-t border-[color:var(--border-color)] text-center hover:bg-gray-50/70 dark:hover:bg-gray-800/60"
                  >
                    <td className="px-4 py-2 whitespace-nowrap">{row.dateLabel}</td>
                    {columns.map((col) => (
                      <td key={col} className="px-4 py-2">
                        {row.counts[col]}
                      </td>
                    ))}
                  </tr>
                ))}
                {!cfdTable.length && (
                  <tr>
                    <td
                      className="px-4 py-3 text-center text-sm text-gray-500"
                      colSpan={1 + columns.length}
                    >
                      No CFD data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThroughputPanel;
