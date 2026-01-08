import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getDoneColumn } from "../../api/columnApi";
import axiosInstance from "../../api/axiosInstance";
import { socket } from "../../socket";

type Task = {
  _id?: string;
  id?: string;
  title?: string;
  status?: string;
  // optional fields used by the board code
  column_id?: string | { _id?: string; name?: string };
  column?: any;
  columnId?: string | { _id?: string; name?: string };
  swimlane_id?: string | { _id?: string; name?: string };
  swimlane?: any;
  swimlaneId?: string | { _id?: string; name?: string };
  [key: string]: any;
};

type Props = {
  board?: any;
  tasks: Task[];
  columns?: any[];
  swimlanes?: any[];
  members?: any[];
};

const donutColors = {
  done: "#a78bfa", // purple
  inProgress: "#3b82f6", // blue
  todo: "#10b981", // green
};

const BoardSummary: React.FC<Props> = ({
  board,
  tasks,
  columns = [],
  swimlanes = [],
  members = [],
}) => {
  const navigate = useNavigate();
  // Determine Done column id from props or API
  const [doneColumnId, setDoneColumnId] = useState<string | null>(null);

  // Donut SVG params (increased for a larger ring)
  const radius = 112;
  const stroke = 34;
  const circumference = 2 * Math.PI * radius;

  // Normalize helper
  const getId = (o: any) => (o?._id || o?.id || o || "").toString();

  useEffect(() => {
    // 1) Prefer columns prop if any column marked as done
    const fromColumns = Array.isArray(columns)
      ? columns.find((c: any) => c?.isDone === true || c?.isdone === true) ||
        null
      : null;
    if (fromColumns) {
      setDoneColumnId(getId(fromColumns));
      return;
    }

    // 2) Otherwise try API by board id
    const boardId = board?._id || board?.id;
    if (!boardId) {
      setDoneColumnId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getDoneColumn(boardId);
        if (!cancelled) setDoneColumnId(getId(res?.data));
      } catch {
        if (!cancelled) setDoneColumnId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [board, columns]);

  // Compute counts: if Done column is known, use it; else fallback to status heuristics
  const { done, active, total } = useMemo(() => {
    const totalCount = tasks.length;
    if (doneColumnId) {
      let d = 0;
      tasks.forEach((t) => {
        const cid = getId(t.column_id || t.column || t.columnId || "");
        if (cid && cid === doneColumnId) d++;
      });
      return { done: d, active: totalCount - d, total: totalCount };
    }
    // Fallback: status string heuristics
    let d = 0;
    tasks.forEach((t) => {
      const s = (t.status || "").toString().toLowerCase();
      if (s.includes("done") || s.includes("complete") || s.includes("closed"))
        d++;
    });
    return { done: d, active: totalCount - d, total: totalCount };
  }, [tasks, doneColumnId]);

  // Note: progress overlay arc removed — donut shows column segments only

  // Build column and swimlane breakdowns with useMemo so they follow the active board data
  const columnList = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    columns.forEach((c: any) =>
      map.set(getId(c), { name: c.name || getId(c), count: 0 })
    );
    tasks.forEach((t) => {
      const col = t.column_id || t.column || t.columnId || "unknown";
      const cid = getId(col);
      if (!map.has(cid))
        map.set(cid, {
          name: (typeof col === "string" ? col : col?.name) || cid,
          count: 0,
        });
      map.get(cid)!.count += 1;
    });
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      count: v.count,
    }));
  }, [columns, tasks]);

  const swimList = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    swimlanes.forEach((s: any) =>
      map.set(getId(s), { name: s.name || getId(s), count: 0 })
    );
    tasks.forEach((t) => {
      const swim = t.swimlane_id || t.swimlane || t.swimlaneId || "default";
      const sid = getId(swim);
      if (!map.has(sid))
        map.set(sid, {
          name: (typeof swim === "string" ? swim : swim?.name) || sid,
          count: 0,
        });
      map.get(sid)!.count += 1;
    });
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      name: v.name,
      count: v.count,
    }));
  }, [swimlanes, tasks]);

  // Compute per-swimlane, per-column counts so we can show detailed data
  const swimlaneColumnCounts = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    tasks.forEach((t) => {
      const sid = getId(
        t.swimlane_id || t.swimlane || t.swimlaneId || "default"
      );
      const cid = getId(t.column_id || t.column || t.columnId || "unknown");
      if (!map.has(sid)) map.set(sid, new Map());
      const inner = map.get(sid)!;
      inner.set(cid, (inner.get(cid) || 0) + 1);
    });
    return map;
  }, [tasks]);

  // Compute done counts per swimlane for small progress ring
  const swimlaneDoneCounts = useMemo(() => {
    const m = new Map<string, { done: number; total: number }>();
    swimList.forEach((s) => m.set(s.id, { done: 0, total: s.count }));
    tasks.forEach((t) => {
      const sid = getId(
        t.swimlane_id || t.swimlane || t.swimlaneId || "default"
      );
      const rec = m.get(sid) || { done: 0, total: 0 };
      let isDone = false;
      if (doneColumnId) {
        const cid = getId(t.column_id || t.column || t.columnId || "");
        isDone = !!cid && cid === doneColumnId;
      } else {
        const sStatus = (t.status || "").toString().toLowerCase();
        isDone =
          sStatus.includes("done") ||
          sStatus.includes("complete") ||
          sStatus.includes("closed");
      }
      if (isDone) rec.done += 1;
      rec.total += 1;
      m.set(sid, rec);
    });
    return m;
  }, [tasks, swimList, doneColumnId]);

  const [showSwimDetails, setShowSwimDetails] = useState(false);

  // Palette for column colors (cycles if more columns)
  const palette = [
    "#6366F1",
    "#06B6D4",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
    "#3B82F6",
    "#EC4899",
    "#94A3B8",
  ];

  // Build donut segments from columns so the ring follows column data
  const segments = useMemo(() => {
    if (!columnList || columnList.length === 0) return [];
    return columnList.map((col, i) => {
      const value = (col.count / (total || 1)) * circumference;
      return {
        id: col.id,
        name: col.name,
        value,
        color: palette[i % palette.length],
        rawCount: col.count,
      };
    });
  }, [columnList, circumference, total]);

  // Tags: totals per tag and how many are in the Done column; also include "No tag"
  const { tagTotals, tagInDone } = useMemo(() => {
    const totals = new Map<string, number>();
    const inDone = new Map<string, number>();
    const nameMap = new Map<string, string>();
    const NO_TAG_ID = "no-tag";
    const isTaskInDone = (t: any) => {
      if (!doneColumnId) return false;
      const colId = getId(t.column_id || t.column || t.columnId || "");
      return !!colId && colId === doneColumnId;
    };

    tasks.forEach((t) => {
      const rawTags = Array.isArray(t.tags) ? t.tags : t.tag ? [t.tag] : [];
      const tags = rawTags && rawTags.length ? rawTags : [NO_TAG_ID];
      const inDoneFlag = isTaskInDone(t);
      tags.forEach((tg: any) => {
        let key: string;
        let display: string;
        if (tg === NO_TAG_ID) {
          key = NO_TAG_ID;
          display = "No tag";
        } else if (typeof tg === "string") {
          key = tg;
          display = tg;
        } else {
          display = (tg && (tg.name || tg.title || tg.label)) || getId(tg);
          key = getId(tg) || display;
        }
        if (!key) return;
        nameMap.set(key, display);
        totals.set(key, (totals.get(key) || 0) + 1);
        if (inDoneFlag) inDone.set(key, (inDone.get(key) || 0) + 1);
      });
    });
    return {
      tagTotals: Array.from(totals.entries()).map(([id, count]) => ({
        id,
        name: nameMap.get(id) || id,
        count,
      })),
      tagInDone: inDone,
    };
  }, [tasks, doneColumnId]);

  // --- Notifications logic for Recent activity (mirrors NotificationBell) ---
  type NotificationItem = {
    id: string;
    text: string;
    time: string;
    rawTime: Date;
    avatar?: string;
    boardId?: string;
    taskId?: string;
    read_at?: Date | null;
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const [notifLoading, setNotifLoading] = useState(false);
  const [notifItems, setNotifItems] = useState<NotificationItem[]>([]);
  const [notifUnreadCount, setNotifUnreadCount] = useState<number>(0);
  const [notifActiveTab, setNotifActiveTab] = useState<"unread" | "read">("unread");
  const notifClickTimerRef = useRef<number | null>(null);

  const loadNotifications = async () => {
    try {
      setNotifLoading(true);
      const userId = localStorage.getItem("userId") || "anonymous";
      const response = await axiosInstance.get(`/notification/${userId}`);
      const notifications = response.data?.data || [];

      const translateNotificationText = (text?: string | null) => {
        if (!text) return text || "";
        let t = text.toString();
        t = t.replace(/Task\s*\"([^\"]+)\"\s*có nguy cơ trễ hạn với điểm số\s*([0-9.]+)/i, 'Task "$1" is at risk of delay with score $2');
        t = t.replace(/Task có nguy cơ trễ hạn[:：]?\s*/gi, "Task at risk of delay: ");
        t = t.replace(/có nguy cơ trễ hạn với điểm số/gi, "is at risk of delay with score");
        t = t.replace(/có nguy cơ trễ hạn/gi, "is at risk of delay");
        t = t.replace(/điểm số/gi, "score");
        return t;
      };

      const itemsBuilt: NotificationItem[] = notifications.map((notif: any) => {
        const dt = new Date(notif.created_at || Date.now());
        const rawText = notif.body || notif.title || "New notification";
        return {
          id: notif._id || notif.id,
          text: translateNotificationText(rawText),
          time: getTimeAgo(dt),
          rawTime: dt,
          avatar: notif.type?.substring(0, 2).toUpperCase() || "📢",
          boardId: notif.board_id,
          taskId: notif.task_id,
          read_at: notif.read_at,
        };
      });

      setNotifItems(itemsBuilt);
      const unread = notifications.filter((n: any) => !n.read_at).length;
      setNotifUnreadCount(unread);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to load notifications", err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(() => loadNotifications(), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleReload = () => setTimeout(() => loadNotifications(), 100);
    socket.on("task_moved", handleReload);
    socket.on("task_updated", handleReload);
    socket.on("task_created", handleReload);
    socket.on("notification", handleReload);
    return () => {
      socket.off("task_moved");
      socket.off("task_updated");
      socket.off("task_created");
      socket.off("notification");
    };
  }, []);

  const notifHandleMarkAsRead = async (id: string) => {
    try {
      await axiosInstance.put(`/notification/read/${id}`);
      setNotifItems((items) => items.map((i) => (i.id === id ? { ...i, read_at: new Date() } : i)));
      setNotifUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to mark as read:", e);
    }
  };

  const notifHandleMarkAllAsRead = async () => {
    try {
      const unreadItems = notifItems.filter((i) => !i.read_at);
      await Promise.all(unreadItems.map((i) => axiosInstance.put(`/notification/read/${i.id}`)));
      setNotifItems((items) => items.map((i) => ({ ...i, read_at: new Date() })));
      setNotifUnreadCount(0);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to mark all as read:", e);
    }
  };

  const notifHandleClearAllRead = async () => {
    try {
      const readItems = notifItems.filter((i) => i.read_at);
      await Promise.all(readItems.map((i) => axiosInstance.delete(`/notification/${i.id}`)));
      setNotifItems((items) => items.filter((i) => !i.read_at));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to delete read notifications:", e);
    }
  };

  const notifUnreadItems = notifItems.filter((i) => !i.read_at);
  const notifReadItems = notifItems.filter((i) => i.read_at);

  const notifHandleItemClick = (n: NotificationItem) => {
    if (notifClickTimerRef.current) {
      window.clearTimeout(notifClickTimerRef.current);
    }
    notifClickTimerRef.current = window.setTimeout(() => {
      if (n?.id && !n.read_at) notifHandleMarkAsRead(n.id);
    }, 250);
  };

  const notifHandleItemDoubleClick = (n: NotificationItem) => {
    if (notifClickTimerRef.current) {
      window.clearTimeout(notifClickTimerRef.current);
      notifClickTimerRef.current = null;
    }
    notifHandleOpenNotification(n);
  };

  const notifHandleOpenNotification = (n: NotificationItem) => {
    if (n?.id && !n.read_at) notifHandleMarkAsRead(n.id);
    if (n?.boardId && n?.taskId) {
      navigate(`/project/${n.boardId}/${n.taskId}`);
    } else if (n?.boardId) {
      navigate(`/project/${n.boardId}`);
    }
  };
  // --- end notifications logic ---

  // Helper to create safe class names from tag id
  const sanitize = (s: string) =>
    s.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64);

  // Inject CSS rules for tag fills so we avoid inline styles entirely
  useEffect(() => {
    const styleId = "board-summary-tag-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const rules: string[] = [];
    tagTotals.forEach((tag) => {
      const doneCount = tagInDone.get(tag.id) || 0;
      const pct =
        tag.count === 0 ? 0 : Math.round((doneCount / tag.count) * 100);
      const cls = `.tw-tag-row-${sanitize(tag.id)} .tw-tag-fill`;
      rules.push(`${cls}{width:${pct}%}`);
    });
    styleEl.innerHTML = rules.join("\n");
    return () => {
      if (styleEl) styleEl.innerHTML = "";
    };
  }, [tagTotals, tagInDone]);

  // Inject CSS rule for the small overview mini-bar to avoid inline styles
  useEffect(() => {
    const styleId = "board-summary-mini-bar";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    styleEl.innerHTML = `.tw-mini-bar-fill{width:${pct}%}`;
    return () => {
      if (styleEl) styleEl.innerHTML = "";
    };
  }, [done, total]);

  // Inject palette helpers for swatches without inline styles
  useEffect(() => {
    const styleId = "board-summary-palette-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const rules: string[] = [];
    palette.forEach((color, i) => {
      rules.push(`.tw-swatch-${i}{background:${color}}`);
      rules.push(`.tw-stroke-${i}{stroke:${color}}`);
    });
    styleEl.innerHTML = rules.join("\n");
    return () => {
      if (styleEl) styleEl.innerHTML = "";
    };
  }, []);

  // Inject CSS for swimlane per-column progress widths (avoid inline styles)
  useEffect(() => {
    const styleId = "board-summary-swim-bars";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const rules: string[] = [];
    swimList.forEach((swim) => {
      const perCol = swimlaneColumnCounts.get(swim.id) || new Map<string, number>();
      columnList.forEach((col) => {
        const count = perCol.get(col.id) || 0;
        const pct = swim.count === 0 ? 0 : Math.round((count / swim.count) * 100);
        const cls = `.tw-swim-row-${sanitize(swim.id)}-${sanitize(col.id)} .tw-swim-fill`;
        rules.push(`${cls}{width:${pct}%}`);
      });
    });
    styleEl.innerHTML = rules.join("\n");
    return () => {
      if (styleEl) styleEl.innerHTML = "";
    };
  }, [swimList, columnList, swimlaneColumnCounts]);

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 shadow-lg">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-blue-800">
          {board?.title || board?.name || "Board Summary"}
        </h2>
      </div>

      {/* Top row: left legend + donut, right overview + actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Columns legend and stats */}
        <div className="lg:col-span-2 bg-gradient-to-r from-white to-blue-50 rounded-xl border border-blue-100 p-5">
          <div className="text-sm font-semibold text-blue-800 mb-3">Columns</div>
          <div className="space-y-3">
            {segments.length === 0 ? (
              <div className="text-blue-500 text-sm">No columns or tasks</div>
            ) : (
              segments.map((seg, i) => (
                <div key={seg.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-3 h-3 rounded-sm tw-swatch-${i % palette.length}`} />
                    <div className="text-sm text-blue-900 truncate">{seg.name}</div>
                  </div>
                  <div className="text-sm text-blue-700">
                    {seg.rawCount}
                    <span className="text-blue-500 ml-1">
                      (
                      {total === 0 ? 0 : Math.round((seg.rawCount / total) * 100)}%
                      )
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 grid place-items-center">
            <div className="relative">
              <svg width={280} height={280} viewBox="0 0 280 280">
                <g transform="translate(140,140)">
                  <circle r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth={stroke} />
                  {(() => {
                    let localOffset = 0;
                    return segments.map((seg, i) => {
                      const dash = `${seg.value} ${circumference - seg.value}`;
                      const strokeDashoffset = -localOffset;
                      localOffset += seg.value;
                      return (
                        <circle
                          key={i}
                          r={radius}
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth={stroke}
                          strokeDasharray={dash}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="butt"
                          transform="rotate(-90)"
                        />
                      );
                    });
                  })()}

                  <text x="0" y="-6" textAnchor="middle" className="fill-blue-900 text-[22px] font-bold">
                    {total}
                  </text>
                  <text x="0" y="18" textAnchor="middle" className="fill-blue-600 text-xs">
                    Total work items
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Overview and actions */}
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowSwimDetails((v) => !v)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition"
            >
              {showSwimDetails ? "Hide details" : "More info"}
            </button>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <div className="text-sm font-semibold text-blue-800 mb-3">Overview</div>
            <div className="flex items-center justify-between text-sm text-blue-900">
              <div>Completion</div>
              <div className="font-bold">{total === 0 ? "0%" : Math.round((done / total) * 100) + "%"}</div>
            </div>
            <div className="w-full h-2 bg-blue-100 rounded-full mt-2 overflow-hidden" aria-hidden>
              <div className="tw-mini-bar-fill h-full bg-gradient-to-r from-blue-600 to-blue-400" />
            </div>
            <div className="flex items-center justify-between text-sm text-blue-900 mt-4">
              <div>Active</div>
              <div className="font-bold">{active}</div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-blue-800">Recent activity</div>
              <button
                onClick={loadNotifications}
                disabled={notifLoading}
                className="p-1.5 rounded-lg hover:bg-blue-50 transition-all disabled:opacity-50"
                title="Refresh"
              >
                <svg
                  className={`w-4 h-4 text-gray-600 ${notifLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                (() => {
                  const items = [...notifItems]
                    .sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime())
                    .slice(0, 8);
                  if (items.length === 0) {
                    return <div className="text-sm text-blue-500 py-8 text-center">No recent activity</div>;
                  }
                  return (
                    <div className="divide-y divide-blue-100">
                      {items.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => notifHandleItemClick(n)}
                          onDoubleClick={() => notifHandleItemDoubleClick(n)}
                          className="py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <div className="flex gap-3 px-1">
                            <div className={`flex-shrink-0 w-9 h-9 rounded-full ${n.read_at ? 'bg-blue-100 text-blue-600' : 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'} grid place-items-center text-xs font-bold`}> 
                              {n.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-blue-900 font-medium line-clamp-2 break-words">
                                {n.text}
                              </p>
                              <p className="text-xs text-blue-400 mt-1">{n.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* More info: Swimlane details without mini ring */}
      {showSwimDetails && (
        <div className="mt-8">
          <h4 className="text-base font-semibold text-blue-800 mb-4">Swimlane details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {swimList.map((swim) => {
              const perCol = swimlaneColumnCounts.get(swim.id) || new Map<string, number>();
              const sd = swimlaneDoneCounts.get(swim.id) || { done: 0, total: swim.count };
              return (
                <div key={swim.id} className="rounded-xl border border-blue-100 p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="text-sm font-semibold text-blue-900 truncate">{swim.name}</div>
                      {/* Removed ring: show done/total chip */}
                      <span className="ml-2 px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-700">
                        {sd.done}/{sd.total}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 whitespace-nowrap">{swim.count} tasks</div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {columnList.map((col, idx) => {
                      const count = perCol.get(col.id) || 0;
                      const pct = swim.count === 0 ? 0 : Math.round((count / swim.count) * 100);
                      return (
                        <div key={col.id} className="rounded-lg border border-blue-100 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`inline-block w-2.5 h-2.5 rounded-sm tw-swatch-${idx % palette.length}`} />
                              <span className="text-sm text-blue-900 truncate">{col.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-blue-700">{count} ({pct}%)</span>
                          </div>
                          <div className={`w-full h-2 bg-blue-50 rounded-full overflow-hidden tw-swim-row-${sanitize(swim.id)}-${sanitize(col.id)}`}>
                            <div className="tw-swim-fill h-full bg-gradient-to-r from-blue-600 to-blue-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Tags progress */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="text-sm font-semibold text-blue-800 mb-3">Tags progress</div>
              <div className="space-y-3">
                {tagTotals.length === 0 ? (
                  <div className="text-blue-500 text-sm">No tags found</div>
                ) : (
                  tagTotals.map((tag) => {
                    const doneCount = tagInDone.get(tag.id) || 0;
                    const pct = tag.count === 0 ? 0 : Math.round((doneCount / tag.count) * 100);
                    return (
                      <div key={tag.id} className={`flex items-center gap-3 tw-tag-row-${sanitize(tag.id)}`}>
                        <div className="w-36 text-sm text-blue-900 truncate">{tag.name || tag.id}</div>
                        <div className="flex-1 h-2 bg-blue-50 rounded-full overflow-hidden">
                          <div className="tw-tag-fill h-full bg-gradient-to-r from-green-600 to-green-400" />
                        </div>
                        <div className="w-28 text-right text-sm text-blue-700">
                          {doneCount}/{tag.count} ({pct}%)
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardSummary;
