// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { socket } from "../socket";
import toast from 'react-hot-toast';

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

interface NotificationBellProps {}

const NotificationBell: React.FC<NotificationBellProps> = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const clickTimerRef = useRef<number | null>(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId") || "anonymous";

      // ✅ Gọi API notifications từ Backend
      const response = await axiosInstance.get(`/notification/${userId}`);
      const notifications = response.data?.data || [];

      // Translator for common Vietnamese phrases in notifications
      const translateNotificationText = (text?: string | null) => {
        if (!text) return text || "";
        let t = text.toString();

        // Example: Task "admin" có nguy cơ trễ hạn với điểm số 0.60
        t = t.replace(/Task\s*\"([^\"]+)\"\s*có nguy cơ trễ hạn với điểm số\s*([0-9.]+)/i, 'Task "$1" is at risk of delay with score $2');
        t = t.replace(/Task có nguy cơ trễ hạn[:：]?\s*/gi, "Task at risk of delay: ");
        t = t.replace(/có nguy cơ trễ hạn với điểm số/gi, "is at risk of delay with score");

        // Small replacements
        t = t.replace(/có nguy cơ trễ hạn/gi, "is at risk of delay");
        t = t.replace(/nguy cơ/gi, "risk");
        t = t.replace(/điểm số/gi, "score");

        return t;
      };

      // Map notifications từ Backend và giới hạn tối đa 100 thông báo
      const itemsBuilt: NotificationItem[] = notifications
        .slice(0, 100) // ✅ Giới hạn tối đa 100 thông báo
        .map((notif: any) => {
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

      setItems(itemsBuilt);

      // Đếm unread dựa trên read_at từ Backend
      const unread = notifications.filter((n: any) => !n.read_at).length;
      setUnreadCount(unread);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount and every 60s
  useEffect(() => {
    loadNotifications();
    const id = setInterval(() => loadNotifications(), 60000);
    return () => clearInterval(id);
  }, []);

  // Socket listeners for realtime updates
  useEffect(() => {
    if (!socket) {
      return;
    }
    const handleReload = () => {
      setTimeout(() => loadNotifications(), 100);
    };
    socket.on("task_moved", handleReload);
    socket.on("task_updated", handleReload);
    socket.on("task_created", handleReload);
    socket.on("comment_created", handleReload);
    socket.on("comment_updated", handleReload);
    socket.on("comment_deleted", handleReload);
    socket.on("notification", handleReload);
    socket.on("at_risk_task_detected", handleReload);
    return () => {
      socket.off("task_moved", handleReload);
      socket.off("task_updated", handleReload);
      socket.off("task_created", handleReload);
      socket.off("comment_created", handleReload);
      socket.off("comment_updated", handleReload);
      socket.off("comment_deleted", handleReload);
      socket.off("notification", handleReload);
      socket.off("at_risk_task_detected", handleReload);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    setOpen((s) => !s);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      // ✅ Gọi API Backend để mark as read
      await axiosInstance.put(`/notification/read/${id}`);

      // Update UI
      setItems(
        items.map((i) => (i.id === id ? { ...i, read_at: new Date() } : i))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      toast.error('Unable to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Mark all unread as read
      const unreadItems = items.filter((i) => !i.read_at);
      await Promise.all(
        unreadItems.map((i) => axiosInstance.put(`/notification/read/${i.id}`))
      );

      // Update UI
      setItems(items.map((i) => ({ ...i, read_at: new Date() })));
      setUnreadCount(0);
    } catch (e) {
      toast.error('Unable to mark all notifications as read');
    }
  };

  const handleClearAllRead = async () => {
    try {
      // ✅ Xóa tất cả notifications đã đọc qua API Backend
      const readItems = items.filter((i) => i.read_at);
      await Promise.all(
        readItems.map((i) => axiosInstance.delete(`/notification/${i.id}`))
      );

      // Update UI
      setItems(items.filter((i) => !i.read_at));
    } catch (e) {
      toast.error('Unable to clear read notifications');
    }
  };

  // ✅ Giới hạn tối đa 100 thông báo cho mỗi tab
  const unreadItems = items.filter((i) => !i.read_at).slice(0, 100);
  const readItems = items.filter((i) => i.read_at).slice(0, 100);

  const handleItemClick = (n: NotificationItem) => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
    }
    clickTimerRef.current = window.setTimeout(() => {
      if (n?.id && !n.read_at) handleMarkAsRead(n.id);
    }, 250);
  };

  const handleItemDoubleClick = (n: NotificationItem) => {
    if (clickTimerRef.current) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    handleOpenNotification(n);
  };

  const handleOpenNotification = (n: NotificationItem) => {
    if (n?.id && !n.read_at) handleMarkAsRead(n.id);
    if (n?.boardId && n?.taskId) {
      navigate(`/project/${n.boardId}/${n.taskId}`);
    } else if (n?.boardId) {
      navigate(`/project/${n.boardId}`);
    }
    setOpen(false);
  };

  return (
    <div className="relative inline-block z-50" ref={wrapperRef}>
      {/* Bell Icon Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6 text-gray-700 hover:text-indigo-600 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-600 rounded-full shadow-lg">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute top-12 right-0 w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "unread" && unreadItems.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors disabled:opacity-50"
                  title="Mark all as read"
                >
                  Mark all as read
                </button>
              )}
              {activeTab === "read" && readItems.length > 0 && (
                <button
                  onClick={handleClearAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 hover:underline transition-colors disabled:opacity-50"
                  title="Clear all read notifications"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear all
                </button>
              )}
              <button
                onClick={loadNotifications}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-white/80 transition-all disabled:opacity-50"
                title="Refresh"
              >
                <svg
                  className={`w-4 h-4 text-gray-600 ${
                    loading ? "animate-spin" : ""
                  }`}
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
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            {[
              { key: "unread", label: "Unread", count: unreadItems.length },
              { key: "read", label: "Read", count: readItems.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "unread" | "read")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all duration-200 relative ${
                  activeTab === tab.key
                    ? "text-indigo-600 bg-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.key
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600" />
                )}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {activeTab === "unread" && (
                  <>
                    {unreadItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <svg
                          className="w-16 h-16 mb-3 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-sm font-medium">
                          No new notifications
                        </p>
                      </div>
                    ) : (
                      unreadItems.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleItemClick(n)}
                          onDoubleClick={() => handleItemDoubleClick(n)}
                          className="px-6 py-4 hover:bg-indigo-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 group"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                              {n.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 font-medium line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {n.text}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {n.time}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === "read" && (
                  <>
                    {readItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <svg
                          className="w-16 h-16 mb-3 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-medium">
                          No read notifications
                        </p>
                      </div>
                    ) : (
                      readItems.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleItemDoubleClick(n)}
                          className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 opacity-70 hover:opacity-100"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-sm">
                              {n.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {n.text}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {n.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
