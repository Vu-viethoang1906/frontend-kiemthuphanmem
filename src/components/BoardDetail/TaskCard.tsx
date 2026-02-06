import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UniqueIdentifier } from "@dnd-kit/core";
import { updateTask, toggleTaskStar } from "../../api/taskApi";
import { uploadFileToTask } from "../../api/fileApi";
import toast from "react-hot-toast";
import { getMe } from "../../api/authApi";
import "../../styles/BoardDetail/TaskCard.css"; // Đảm bảo đường dẫn CSS đúng

// Định nghĩa kiểu dữ liệu chính xác hơn cho Task
type Task = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  column_id: string;
  swimlane_id?: string;
  assigned_to?: {
    username: string;
    full_name?: string;
    _id?: string;
    avatar_url?: string;
  };
  tags?: any[];
  due_date?: string;
  starred_by?: string[] | any[];
};

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: string;
  swimlaneId: string;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, taskTitle: string) => void; // Giữ lại nếu cần
  members: any[]; // Danh sách thành viên của board
  reloadTasks: () => void; // 🔥 callback để load lại tasks
  onReloadEditingTask?: (taskId: string) => void; // 🔥 callback để reload task đang được edit
}

// Giả định hàm lấy màu avatar từ tên nếu không có ảnh (getAvatarColor từ BoardDetail)
const getAvatarColor = (name: string): string => {
  const colors = [
    "#6B7280",
    "#9CA3AF",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#3B82F6",
    "#14B8A6",
    "#F97316",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const code = name.codePointAt(i) || 0;
    hash = code + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  columnId,
  swimlaneId,
  members,
  reloadTasks,
  onEdit,
  onReloadEditingTask,
}) => {
  // ⚠️ CHÚ Ý: Cần thay đổi baseUrl nếu chạy ở môi trường khác
  const baseUrl = "http://localhost:3005/api";
  const [showAssigneeList, setShowAssigneeList] = useState(false);
  const [avatarPosition, setAvatarPosition] = useState({ top: 0, left: 0 });
  const [localAssignee, setLocalAssignee] = useState(task.assigned_to);
  const openerRef = useRef<HTMLElement | null>(null);
  const [showToast, setShowToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  const [assigneeSearch, setAssigneeSearch] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isStarring, setIsStarring] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DND-KIT SETUP ---
  const sortableId: UniqueIdentifier = (task._id ||
    task.id ||
    `temp-${columnId}-${swimlaneId}-${index}`) as UniqueIdentifier;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    data: { isTask: true, columnId, swimlaneId }, // Thêm dữ liệu để dễ dàng kiểm tra ở handleDragEnd
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: "grab",
    opacity: isDragging ? 0.5 : 1,

    padding: "14px",

    marginBottom: "12px",
    // Đảm bảo task đang kéo luôn nằm trên (CSS property)
    zIndex: isDragging ? 10 : 0,
  };

  // --- TASK LOGIC ---

  const getAvatarImageUrl = (task: Task) => {
    if (task.assigned_to?.avatar_url) {
      // Loại bỏ base URL nếu avatar_url đã là một URL hoàn chỉnh,
      // nếu không, nối lại
      return task.assigned_to.avatar_url.startsWith("http")
        ? task.assigned_to.avatar_url
        : baseUrl + task.assigned_to.avatar_url;
    }
    return ""; // Trả về chuỗi rỗng nếu không có avatar_url
  };

  const toggleAssigneeList = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Ngăn chặn mọi hành vi mặc định
    const el = e.currentTarget as HTMLElement;
    openerRef.current = el;
    const rect = el.getBoundingClientRect();
    // schedule position update in rAF to avoid layout jank
    requestAnimationFrame(() => {
      setAvatarPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      });
      setShowAssigneeList((prev) => !prev);
    });
  };

  const pushRecentAssignee = (user: {
    _id?: string;
    id?: string;
    username: string;
    avatar_url?: string;
  }) => {
    try {
      const key = "recentAssignees";
      const stored = localStorage.getItem(key);
      let list: any[] = [];
      if (stored) list = JSON.parse(stored);
      const uid = user._id || user.id;
      if (!uid) return;
      // Remove existing entry if present
      list = list.filter((x) => (x._id || x.id) !== uid);
      // Add to top with timestamp
      list.unshift({
        _id: uid,
        username: user.username,
        avatar_url: user.avatar_url,
        ts: Date.now(),
      });
      // Keep only 8 most recent
      list = list.slice(0, 8);
      localStorage.setItem(key, JSON.stringify(list));
    } catch {}
  };

  const getRecentAssignees = (): any[] => {
    try {
      const stored = localStorage.getItem("recentAssignees");
      if (!stored) return [];
      const list = JSON.parse(stored) as any[];
      // Map to only members that still exist in current board (if available)
      const memberMap = new Map<string, any>();
      members.forEach((m) => {
        const uid = m.user_id?._id || m.user_id?.id;
        if (uid) memberMap.set(uid, m);
      });
      const result: any[] = [];
      for (const item of list) {
        const uid = item._id || item.id;
        if (uid && memberMap.has(uid)) {
          result.push(memberMap.get(uid));
        }
      }
      return result;
    } catch {
      return [];
    }
  };

  const handleAssign = async (member: any) => {
    try {
      const taskId = task._id || task.id;
      if (!taskId) return;

      // Kiểm tra member và user_id có tồn tại không
      if (!member?.user_id) {
        setShowToast({
          show: true,
          message: "Invalid member data!",
          type: "error",
        });
        setTimeout(
          () => setShowToast({ show: false, message: "", type: "error" }),
          2000
        );
        return;
      }

      // user_id trong member là object chứa _id
      const assigned_to_id = member.user_id._id || member.user_id.id;
      if (!assigned_to_id) {
        setShowToast({
          show: true,
          message: "Member ID not found!",
          type: "error",
        });
        setTimeout(
          () => setShowToast({ show: false, message: "", type: "error" }),
          2000
        );
        return;
      }

      // Bắt đầu loading
      setIsAssigning(true);

      // Gọi API assign
      await updateTask(taskId, { assigned_to: assigned_to_id });

      // Cập nhật UI sau khi API thành công
      setLocalAssignee({
        username: member.user_id.username || "Unknown",
        _id: assigned_to_id,
        avatar_url: member.user_id.avatar_url,
      });
      setShowAssigneeList(false);
      setAssigneeSearch(""); // Reset search khi assign thành công
      pushRecentAssignee(member.user_id);

      // Hiển thị toast thành công
      const username = member.user_id.username || "Unknown";
      setShowToast({
        show: true,
        message: `Assigned task to ${username} successfully!`,
        type: "success",
      });
      setTimeout(
        () => setShowToast({ show: false, message: "", type: "success" }),
        2000
      );

      // Tải lại dữ liệu sau khi giao nhiệm vụ (defer to avoid jank)
      setTimeout(() => reloadTasks(), 0);
    } catch (err) {
      console.error(err);
      setShowToast({
        show: true,
        message: "Failed to assign task!",
        type: "error",
      });
      setTimeout(
        () => setShowToast({ show: false, message: "", type: "error" }),
        2000
      );
    } finally {
      setIsAssigning(false);
    }
  };

  useEffect(() => {
    setLocalAssignee(task.assigned_to);
  }, [task.assigned_to]);

  // Load current user ID
  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await getMe();
        const uid = me?.success && me?.data?._id ? me.data._id : (me?.data?.id || null);
        if (uid) setCurrentUserId(uid);
        else {
          const stored = localStorage.getItem("userId");
          if (stored) setCurrentUserId(stored);
        }
      } catch {
        const stored = localStorage.getItem("userId");
        if (stored) setCurrentUserId(stored);
      }
    };
    loadUser();
  }, []);

  // Check if task is starred by current user
  useEffect(() => {
    if (!currentUserId || !task.starred_by) {
      setIsStarred(false);
      return;
    }
    const starredByIds = Array.isArray(task.starred_by)
      ? task.starred_by.map((id: any) => (typeof id === 'object' ? id._id || id.id : id))
      : [];
    setIsStarred(starredByIds.includes(currentUserId));
  }, [task.starred_by, currentUserId]);

  // Memoize members list for rendering performance
  const memoizedMembers = useMemo(() => members, [members]);

  const handleOutside = useCallback(
    (e: MouseEvent) => {
      if (!showAssigneeList) return;
      if (
        openerRef.current &&
        (e.target as Node) &&
        openerRef.current.contains(e.target as Node)
      )
        return;
      setShowAssigneeList(false);
      setAssigneeSearch(""); // Reset search khi đóng
    },
    [showAssigneeList]
  );

  useEffect(() => {
    if (!showAssigneeList) return;
    document.addEventListener("mousedown", handleOutside);
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        setShowAssigneeList(false);
        setAssigneeSearch(""); // Reset search khi đóng bằng Escape
      }
    };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [showAssigneeList, handleOutside]);

  const handleCardClick = () => {
    // Không mở form khi popup assignee đang hiển thị
    if (showAssigneeList) return;
    // Chỉ mở modal chỉnh sửa nếu task không đang được kéo thả
    if (!isDragging) {
      onEdit(task);
    }
  };

  const isOverdue = task.due_date
    ? new Date(task.due_date) < new Date() &&
      new Date(task.due_date).setHours(0, 0, 0, 0) !==
        new Date().setHours(0, 0, 0, 0)
    : false;

  const filteredMembers = useMemo(() => {
    // Lọc bỏ các member không có user_id
    const validMembers = members.filter((m) => m?.user_id);
    const q = assigneeSearch.trim().toLowerCase();
    if (!q) return validMembers;
    return validMembers.filter((m) => {
      const u = m.user_id || {};
      const name = (u.full_name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      return name.includes(q) || username.includes(q);
    });
  }, [assigneeSearch, members]);

  const recentMembers = useMemo(
    () => getRecentAssignees(),
    [members, showAssigneeList]
  );

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const taskId = task._id || task.id;
    if (!taskId) {
      setShowToast({
        show: true,
        message: "Task ID not found!",
        type: "error",
      });
      setTimeout(
        () => setShowToast({ show: false, message: "", type: "error" }),
        2000
      );
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadFileToTask(taskId, file);

      setShowToast({
        show: true,
        message: `File "${file.name}" uploaded successfully!`,
        type: "success",
      });
      // Also show global toast for consistent UX
      try {
        toast.success(`File "${file.name}" uploaded successfully!`);
      } catch {}
      setTimeout(
        () => setShowToast({ show: false, message: "", type: "success" }),
        2000
      );
      // Reload tasks to show updated file
      setTimeout(() => {
        reloadTasks();
        // Nếu task đang được edit, reload task đó để cập nhật attachments
        if (onReloadEditingTask) {
          onReloadEditingTask(taskId);
        }
      }, 500);
    } catch (err: any) {
      console.error("Upload error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        config: {
          url: err?.config?.url,
          method: err?.config?.method,
        },
      });

      let errorMessage = "Failed to upload file!";
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setShowToast({ show: true, message: errorMessage, type: "error" });
      try {
        toast.error(errorMessage);
      } catch {}
      setTimeout(
        () => setShowToast({ show: false, message: "", type: "error" }),
        3000
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    // Chặn event propagation để không trigger card click
    e.stopPropagation();
    e.preventDefault();
    // Trigger file input ngay lập tức
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  const handleUploadMouseDown = (e: React.MouseEvent) => {
    // Chặn drag event ngay từ mouseDown để không bị can thiệp bởi dnd-kit
    // Chỉ stopPropagation, không preventDefault để click vẫn hoạt động
    e.stopPropagation();
  };

  const handleUploadPointerDown = (e: React.PointerEvent) => {
    // Chặn pointer events từ dnd-kit để tránh drag
    // Chỉ stopPropagation, không preventDefault
    e.stopPropagation();
  };

  // ⭐ Toggle star/favorite task
  const handleToggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('[TaskCard] handleToggleStar called', { currentUserId, isStarring, taskId: task._id || task.id });
    
    if (!currentUserId) {
      console.error('[TaskCard] No currentUserId');
      toast.error('Không tìm thấy thông tin user');
      return;
    }
    
    if (isStarring) {
      console.log('[TaskCard] Already starring, skip');
      return;
    }

    const taskId = task._id || task.id;
    if (!taskId) {
      console.error('[TaskCard] No taskId', { task });
      toast.error('Không tìm thấy ID của task');
      return;
    }

    console.log('[TaskCard] Calling toggleTaskStar API', { taskId, currentUserId });
    setIsStarring(true);
    try {
      const result = await toggleTaskStar(taskId);
      console.log('[TaskCard] toggleTaskStar success', result);
      setIsStarred(result.is_starred);
      toast.success(result.message || (result.is_starred ? 'Đã đánh dấu task quan trọng' : 'Đã bỏ đánh dấu'));
      reloadTasks();
    } catch (err: any) {
      console.error('[TaskCard] toggleTaskStar error:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        url: err?.config?.url,
        method: err?.config?.method,
        taskId,
        currentUserId,
      });
      const msg = err?.response?.data?.message || err?.message || 'Không thể đánh dấu task';
      toast.error(msg);
    } finally {
      setIsStarring(false);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className="board-card"
        style={style}
        onClick={handleCardClick} // Kích hoạt mở modal khi click
        tabIndex={0}
        onKeyDown={(e) => {
          if (showAssigneeList) return; // chặn khi popup đang mở
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          disabled={isUploading}
        />

        <div className="board-card__header">
          <div className="board-card__title">{task.title}</div>
          <div className="flex items-center gap-1">
            {/* ⭐ Star/Favorite button */}
            {currentUserId && (
              <button
                className={`flex items-center justify-center w-6 h-6 p-0 bg-transparent border-0 rounded cursor-pointer transition-all duration-200 flex-shrink-0 focus:outline-none ${
                  isStarred
                    ? 'text-yellow-500 hover:text-yellow-600'
                    : 'text-gray-400 hover:text-yellow-500 opacity-70 hover:opacity-100'
                } ${isStarring ? 'opacity-50 cursor-wait' : ''}`}
                onClick={handleToggleStar}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                type="button"
                disabled={isStarring}
                title={isStarred ? 'Bỏ đánh dấu task quan trọng' : 'Đánh dấu task quan trọng'}
              >
                {isStarring ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="31.416" strokeDashoffset="31.416">
                      <animate
                        attributeName="stroke-dasharray"
                        dur="2s"
                        values="0 31.416;15.708 15.708;0 31.416;0 31.416"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-dashoffset"
                        dur="2s"
                        values="0;-15.708;-31.416;-31.416"
                        repeatCount="indefinite"
                      />
                    </circle>
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill={isStarred ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </button>
            )}
            {/* Upload file button */}
            <button
            className="flex items-center justify-center w-6 h-6 p-0 bg-transparent border-0 rounded cursor-pointer text-gray-500 transition-all duration-200 flex-shrink-0 opacity-70 hover:bg-gray-100 hover:text-blue-500 hover:opacity-100 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none"
            onClick={handleUploadClick}
            onMouseDown={handleUploadMouseDown}
            onPointerDown={handleUploadPointerDown}
            type="button"
            disabled={isUploading}
            title="Upload file"
          >
            {isUploading ? (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  strokeDasharray="31.416"
                  strokeDashoffset="31.416"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    dur="2s"
                    values="0 31.416;15.708 15.708;0 31.416;0 31.416"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-dashoffset"
                    dur="2s"
                    values="0;-15.708;-31.416;-31.416"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            )}
          </button>
          </div>
        </div>

        {/* Tags và Avatar cùng hàng */}
        <div className="task-tags-and-avatar">
          <div className="task-tags">
            {task.tags?.map((tag) => (
              <span
                key={tag._id || tag.id}
                className="task-tag"
                style={{ backgroundColor: tag.color || "#007bff" }}
              >
                {tag.name}
              </span>
            ))}
          </div>

          <button
            className="assignee-section"
            onClick={toggleAssigneeList}
            type="button"
            disabled={isAssigning}
            style={{ cursor: isAssigning ? "not-allowed" : "pointer" }}
          >
            {isAssigning ? (
              <div className="assignee-loading">
                <svg className="spinner" viewBox="0 0 50 50">
                  <circle
                    className="path"
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    strokeWidth="5"
                  ></circle>
                </svg>
              </div>
            ) : localAssignee ? (
              (() => {
                const avatarUrl = getAvatarImageUrl({ ...task, assigned_to: localAssignee });
                if (!avatarUrl) {
                  return (
                    <div className="assignee-placeholder">
                      {localAssignee?.username?.slice(0, 2).toUpperCase() || "U"}
                    </div>
                  );
                }
                return (
                  <img
                    src={avatarUrl}
                    alt={localAssignee.username}
                    className="assignee-avatar"
                    onError={(e) => {
                      // Fallback to initial/placeholder if image fails
                      (e.target as HTMLImageElement).onerror = null;
                      const color = getAvatarColor(localAssignee?.username || "U");
                      const initial =
                        localAssignee?.username?.slice(0, 2).toUpperCase() || "U";
                      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='${color}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='#fff'>${initial}</text></svg>`;
                      (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                    }}
                  />
                );
              })()
            ) : (
              <div className="assignee-placeholder">+</div>
            )}
          </button>
        </div>

        {/* Due Date - Luôn render để giữ layout */}
        {(() => {
          const dueCls = task.due_date
            ? isOverdue
              ? "overdue"
              : "on-time"
            : "placeholder";
          return (
            <div className={`board-card__due-date ${dueCls}`}>
              {task.due_date ? formatDueDate(task.due_date) : "\u00A0"}
            </div>
          );
        })()}

        {/* Assignee List Portal - Hiển thị danh sách thành viên */}
        {showAssigneeList &&
          createPortal(
            <div
              className="assignee-list"
              style={{
                top: avatarPosition.top,
                left: avatarPosition.left,
                zIndex: 9999,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-72 rounded-xl shadow-xl border border-blue-100 bg-white overflow-hidden">
                <div className="px-3 pt-3 pb-2 border-b border-blue-50 bg-blue-50/50">
                  <div className="relative">
                    <svg
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                </div>

                {recentMembers.length > 0 && (
                  <div className="px-3 py-2">
                    <div className="text-xs font-semibold text-blue-600 mb-1">
                      Recent
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentMembers.slice(0, 5).map((member) => {
                        if (!member?.user_id) return null;
                        return (
                          <button
                            key={member.user_id._id || member.user_id.id}
                            className="flex items-center gap-2 px-2 py-1 rounded-md border border-blue-100 hover:bg-blue-50 transition text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssign(member);
                            }}
                            type="button"
                          >
                            <img
                              src={
                                member.user_id?.avatar_url
                                  ? member.user_id.avatar_url.startsWith("http")
                                    ? member.user_id.avatar_url
                                    : baseUrl + member.user_id.avatar_url
                                  : "https://via.placeholder.com/40"
                              }
                              alt={member.user_id?.username || "User"}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="text-gray-700">
                              {member.user_id?.username || "Unknown"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="max-h-64 overflow-auto divide-y divide-gray-100">
                  {filteredMembers.map((member) => {
                    if (!member?.user_id) return null;
                    return (
                      <button
                        key={member.user_id._id || member.user_id.id}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 transition text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssign(member);
                        }}
                        type="button"
                      >
                        <img
                          src={
                            member.user_id?.avatar_url
                              ? member.user_id.avatar_url.startsWith("http")
                                ? member.user_id.avatar_url
                                : baseUrl + member.user_id.avatar_url
                              : "https://via.placeholder.com/40"
                          }
                          alt={member.user_id?.username || "User"}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-800">
                            {member.user_id?.username || "Unknown"}
                          </span>
                          {member.user_id?.full_name && (
                            <span className="text-xs text-gray-500">
                              {member.user_id.full_name}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* Toast Notification Portal - Hiển thị thông báo */}
      {showToast.show &&
        createPortal(
          <div className={`toast ${showToast.type}`}>{showToast.message}</div>,
          document.body
        )}
    </>
  );
};

export default TaskCard;
