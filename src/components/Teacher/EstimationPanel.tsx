import React, { useEffect, useMemo, useState } from 'react';
import { getTasksByBoard } from '../../api/teacherApi';
import { getEstimationAccuracy } from '../../api/analyticsApi';
import { fetchMyBoards } from '../../api/boardApi';
type AssignedTo =
  | {
      _id?: string;
      username?: string;
      full_name?: string;
    }
  | string
  | null;

type Task = {
  _id: string;
  id?: string;
  title?: string;
  assigned_to?: AssignedTo;
  estimate_hours?: number | null;
  created_at?: string | null;
  done_at?: string | null;
};

function hoursDiff(
  start: string | null | undefined,
  end: string | null | undefined,
): number | null {
  if (!start || !end) return null;
  const s = Date.parse(start);
  const e = Date.parse(end);
  if (isNaN(s) || isNaN(e)) return null;
  const diffMs = e - s;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

// Format hours to days and hours (e.g., 49h = 2d 1h)
function formatHoursToDays(hours: number | null): string {
  if (hours === null || isNaN(hours)) return '-';

  const absHours = Math.abs(hours);
  const days = Math.floor(absHours / 24);
  const remainingHours = Math.round((absHours % 24) * 100) / 100;

  const sign = hours < 0 ? '-' : '';

  if (days === 0) {
    return `${sign}${remainingHours.toFixed(2)}h`;
  } else if (remainingHours === 0) {
    return `${sign}${days}d`;
  } else {
    return `${sign}${days}d ${remainingHours.toFixed(2)}h`;
  }
}

const safeName = (a: AssignedTo | undefined) => {
  if (!a) return '-';
  if (typeof a === 'string') return a;
  return (a.full_name || a.username || (a as any).name) ?? '-';
};

type Row = {
  id: string;
  title: string;
  assignee: string;
  estimate: number | null;
  actual: number | null;
  errorPct: number | null;
  errorPctRaw?: number | null;
  isCapped?: boolean;
  errorHours: number | null; // Chênh lệch giờ (actual - estimate)
  classification: string;
};

const EstimationPanel: React.FC = () => {
  const [boardId, setBoardId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<Array<{ id: string; name: string }>>([]);

  const [overview, setOverview] = useState<{
    totalTasks: number;
    tasksWithEstimate: number;
    averageEstimate: number;
    averageActual: number;
    averageError: number;
    overEstimatedCount: number;
    underEstimatedCount: number;
    accurateCount: number;
    overUnderRatio: number;
    outliersCount: number;
  } | null>(null);

  const [byUser, setByUser] = useState<
    Array<{
      userId: string;
      username: string | null;
      fullName: string | null;
      statistics: {
        totalTasks: number;
        averageEstimate: number;
        averageActual: number;
        averageError: number;
        overEstimatedCount: number;
        underEstimatedCount: number;
        accurateCount: number;
        categoryBreakdown: {
          severeOver: number;
          moderateOver: number;
          accurate: number;
          moderateUnder: number;
          severeUnder: number;
        };
      };
    }>
  >([]);

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const boardMy = await fetchMyBoards();
        const mappedBoards = (boardMy.data || []).map((b: any) => ({
          id: b._id,
          name: b.title, // hoặc b.name tùy API
        }));
        setBoards(mappedBoards);
      } catch (err) {
        setError('Failed to load boards');
      }
    };

    loadBoards();
  }, []);

  const fetchData = async () => {
    if (!boardId) {
        setError('Please select a board');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const [tasksRes, analyticsRes] = await Promise.all([
        getTasksByBoard(boardId, { limit: 1000 }),
        getEstimationAccuracy({ board_id: boardId }),
      ]);

      const taskData = (tasksRes && (tasksRes.data ?? tasksRes.tasks)) ?? tasksRes;
      setTasks(Array.isArray(taskData) ? taskData : []);

      const analyticsData = analyticsRes?.data ?? analyticsRes;
      setOverview(analyticsData?.overview ?? null);
      setByUser(Array.isArray(analyticsData?.byUser) ? analyticsData.byUser : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const doneTasks = useMemo(() => tasks.filter((t) => !!t.done_at), [tasks]);

  const rows: Row[] = useMemo(() => {
    return doneTasks
      .filter((t) => {
        // Filter out tasks with invalid estimates (too small or too large)
        const estimate = typeof t.estimate_hours === 'number' ? t.estimate_hours : null;
        const actual = hoursDiff(t.created_at ?? null, t.done_at ?? null);

        // Skip if no estimate or actual
        if (estimate === null || actual === null) return false;

        // Skip if estimate is too small (< 0.1 hours = 6 minutes) - likely data error
        if (estimate < 0.1) return false;

        // Skip if actual is too large (> 1000 hours) - likely data error
        if (actual > 1000) return false;

        return true;
      })
      .map((t) => {

        const estimate = typeof t.estimate_hours === 'number' ? t.estimate_hours : null;
        const actual = hoursDiff(t.created_at ?? null, t.done_at ?? null);
        let errorPct: number | null = null;
        let errorPctRaw: number | null = null;
        let isCapped = false;

        if (actual !== null && estimate !== null && estimate !== 0) {

          // Calculate raw error
          errorPctRaw = ((actual - estimate) / estimate) * 100;

          // Cap error at ±500% like backend
          const maxError = 500;
          const minError = -500;

          if (errorPctRaw > maxError) {
            errorPct = maxError;
            isCapped = true;
          } else if (errorPctRaw < minError) {
            errorPct = minError;
            isCapped = true;
          } else {
            errorPct = Math.round(errorPctRaw * 100) / 100;
      }
        }

        



        const classification =
          errorPct === null
            ? '-'
            : errorPct > 10
              ? 'Under-estimated'
              : errorPct < -10
                ? 'Over-estimated'
                : Math.abs(errorPct) <= 10
                  ? 'Accurate'
                  : '-';

        // Calculate error in hours (actual - estimate)
        const errorHours =
          actual !== null && estimate !== null ? Math.round((actual - estimate) * 100) / 100 : null;


        return {
          id: t._id || (t.id as string) || Math.random().toString(36).slice(2),
          title: t.title ?? '(No title)',
          assignee: safeName(t.assigned_to),
          estimate,
          actual,
          errorPct,

          errorPctRaw, // Keep raw value for tooltip
          isCapped,
          errorHours,
        classification,
        } as Row & { errorPctRaw?: number | null; isCapped?: boolean };
    });
  }, [doneTasks]);

  // Calculate average error in hours
  const avgErrorHours = useMemo(() => {
    if (overview) {
      // Calculate from average actual and average estimate
      const avgActual = overview.averageActual || 0;
      const avgEstimate = overview.averageEstimate || 0;
      return avgActual - avgEstimate;
    }

    const numeric = rows.filter(
      (r) => r.errorHours !== null && !isNaN(r.errorHours || 0),
    ) as (Row & { errorHours: number })[];
    if (numeric.length === 0) return 0;
    const sum = numeric.reduce((s, r) => s + (r.errorHours || 0), 0);
    return Math.round((sum / numeric.length) * 100) / 100;
  }, [rows, overview]);

  const breakdownByAssignee = useMemo(() => {
    if (byUser.length > 0) {
      return byUser.map((u) => {
        const s = u.statistics;
        const avg = s.averageError;
        const avgDeltaH = s.averageActual - s.averageEstimate;
        const over = s.overEstimatedCount;
        const under = s.underEstimatedCount;
        const count = s.totalTasks;

        return {
          assignee: u.fullName || u.username || '-',
          avg,
          avgDeltaH,
          count,
          over,
          under,
        };
      });
    }

    const map = new Map<
      string,
      { sumPct: number; sumDeltaH: number; count: number; over: number; under: number }
    >();
    rows.forEach((r) => {
      const key = r.assignee || '-';
      const entry = map.get(key) ?? { sumPct: 0, sumDeltaH: 0, count: 0, over: 0, under: 0 };
      if (typeof r.errorPct === 'number') {
        entry.sumPct += r.errorPct;
        entry.count += 1;
        if (r.errorPct > 0) entry.under += 1;
        else if (r.errorPct < 0) entry.over += 1;
      }
      if (typeof r.actual === 'number' && typeof r.estimate === 'number') {
        entry.sumDeltaH += r.actual - r.estimate;
      }
      map.set(key, entry);
    });
    return Array.from(map.entries()).map(([assignee, v]) => ({
      assignee,
      avg: v.count ? Math.round((v.sumPct / v.count) * 100) / 100 : 0,
      avgDeltaH: v.count ? Math.round((v.sumDeltaH / v.count) * 100) / 100 : 0,
      count: v.count,
      over: v.over,
      under: v.under,
    }));
  }, [rows, byUser]);

  return (
    <div className="p-6 text-[color:var(--text-primary)]">
      <div className="mx-auto max-w-6xl space-y-6 border border-[color:var(--border-color)] bg-[color:var(--surface-card)] p-6 shadow-xl shadow-[color:var(--shadow-color)]">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold md:text-2xl">Estimate vs Actual</h2>
            <p className="text-sm text-gray-500">
              Helps instructors monitor learners' estimation accuracy to improve estimating skills.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <select
              className="w-full rounded-none border border-[color:var(--border-color)] bg-transparent px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 sm:w-64"
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
            >
              <option value="">Select a board...</option>

              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <button
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Overview cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Completed tasks
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {overview?.totalTasks ?? doneTasks.length}
            </div>
          </div>
          <div className="border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Average deviation
            </div>
            <div className="mt-1 text-2xl font-semibold">{formatHoursToDays(avgErrorHours)}</div>
            {overview && (
              <div className="mt-1 text-xs text-gray-500">
                ({overview.averageError >= 0 ? '+' : ''}
                {overview.averageError.toFixed(2)}%)
              </div>
            )}
          </div>
          <div className="border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Notes</div>
            <div className="mt-1 text-sm text-gray-600">
              Select a board to view estimation accuracy analysis per learner.
            </div>
          </div>
        </div>

        {/* Task table */}
        <div className="overflow-hidden border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60">
          <div className="grid grid-cols-6 gap-2 border-b border-[color:var(--border-color)] bg-gray-50/80 px-4 py-3 text-sm font-medium text-gray-700 dark:bg-gray-800/60">
            <div>Task</div>
            <div>Assignee</div>
            <div>Estimate (h)</div>
            <div>Actual (h)</div>
            <div>Error (h)</div>
            <div>Classification</div>
          </div>
          <div className="max-h-80 overflow-auto">
            {rows.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-6 items-center gap-2 border-b border-[color:var(--border-color)] px-4 py-3 text-sm last:border-b-0 hover:bg-gray-50/70 dark:hover:bg-gray-800/60"
              >
                <div className="truncate" title={r.title}>
                  {r.title}
                </div>
                <div className="truncate" title={r.assignee}>
                  {r.assignee}
                </div>
                <div>{r.estimate !== null ? r.estimate.toFixed(2) : '-'}</div>
                <div>{r.actual !== null ? r.actual.toFixed(2) : '-'}</div>
                <div
                  className={
                    r.errorHours !== null && r.errorHours > 0
                      ? 'font-medium text-red-600'
                      : r.errorHours !== null && r.errorHours < 0
                        ? 'font-medium text-emerald-600'
                        : 'text-gray-600'
                  }
                  title={
                    r.errorPct !== null
                      ? `Error: ${r.errorPct > 0 ? '+' : ''}${r.errorPct.toFixed(2)}%${r.isCapped ? ' (capped)' : ''}`
                      : undefined
                  }
                >
                  {r.errorHours !== null ? formatHoursToDays(r.errorHours) : '-'}
                </div>
                <div className="text-xs font-medium uppercase tracking-wide text-gray-600">
                  {r.classification}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-user breakdown */}
        <div className="mt-6 space-y-4">
          <h3 className="text-base font-semibold">Chênh lệch trung bình theo người làm</h3>
          <div className="space-y-3">
            {breakdownByAssignee.map((b) => {
              const clamp = (v: number) => {
                if (!isFinite(v)) return 0;
                if (Math.abs(v) > 500) return Math.sign(v) * 500; // Cap at 500 hours
                return v;
              };
              const displayAvgHours = clamp(b.avgDeltaH);
              const avgLabel = formatHoursToDays(displayAvgHours);
              // Scale bar width based on hours (max 500h = full width)
              const maxHours = 500;
              const barWidth = Math.min((Math.abs(displayAvgHours) / maxHours) * 100, 100);
              const colorClass =
                b.avgDeltaH > 0 ? 'bg-red-500' : b.avgDeltaH < 0 ? 'bg-emerald-600' : 'bg-gray-400';
              const overPct = b.count ? Math.round((b.over / b.count) * 100) : 0;
              const underPct = b.count ? Math.round((b.under / b.count) * 100) : 0;
              const avgErrorPct =
                b.avg !== null && b.avg !== undefined
                  ? `${b.avg >= 0 ? '+' : ''}${b.avg.toFixed(2)}%`
                  : '-';

              return (
                <div
                  key={b.assignee}
                  className="flex items-center gap-4 border border-[color:var(--border-color)] bg-[color:var(--surface-card)]/60 px-4 py-3"
                >
                  <div className="w-48 truncate text-sm font-medium">{b.assignee}</div>

                  <div className="flex flex-1 items-center gap-3">
                    <div
                      className="flex-1 overflow-hidden border border-[color:var(--border-color)] bg-gray-100 dark:bg-gray-800"
                      aria-hidden
                    >
                      <div
                        style={{ width: `${barWidth}%` }}
                        className={`${colorClass} h-3 transition-all`}
                        title={`Avg delta: ${avgLabel} • Avg error: ${avgErrorPct} • Tasks: ${b.count}`}
                      />
                    </div>
                    <div className="w-40 min-w-[140px] text-left text-sm font-semibold">
                      {avgLabel}
                    </div>
                    <div
                      className="w-24 min-w-[92px] text-xs text-gray-500"
                      title="Sai số trung bình (%)"
                    >
                      {avgErrorPct}
                    </div>
                  </div>

                  <div className="w-52 min-w-[160px] text-right text-xs text-gray-500">
                    <span className="mr-3">Tasks: {b.count}</span>
                    <span className="mr-2">O:{overPct}%</span>
                    <span>U:{underPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimationPanel;
