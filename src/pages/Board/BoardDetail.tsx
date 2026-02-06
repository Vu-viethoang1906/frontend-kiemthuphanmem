import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Giả định các hàm API này tồn tại
import { fetchBoardById, deleteBoard } from '../../api/boardApi';
import {
  fetchTasksByBoard,
  fetchTaskById,
  createTask,
  deleteTask,
  updateTask,
  moveTaskApi,
  moveColumnApi,
  moveSwimlaneApi,
  fetchTaskHistory,
} from '../../api/taskApi';
import { fetchColumnsByBoard } from '../../api/columnApi';
import { fetchSwimlanesByBoard } from '../../api/swimlaneApi';
import {
  fetchAllTags,
  fetchTagsByTask,
  addTagToTask,
  removeTagFromTask,
  createTag,
  updateTag,
  deleteTag,
  fetchTagsByBoard,
} from '../../api/tagApi';
import { fetchBoardMembers } from '../../api/boardMemberApi';
import { fetchAvatarUser } from '../../api/avataApi';
import axiosInstance from '../../api/axiosInstance';
import { searchTasksByNLP } from '../../api/nlpApi';

// Import toast for notifications
import toast from 'react-hot-toast';
import { useModal } from '../../components/ModalProvider';
import CommentSection from '../../components/CommentSection';
import LoadingScreen from '../../components/LoadingScreen';
import BoardSummary from './BoardSummary';
import TaskCharts from '../Board/lineChart';
import '../../styles/project-board.css';

// Import các components đã tách
import {
  TaskCard,
  CreateTaskModal,
  EditTaskModal,
  TagManagerModal,
  FilterDropdown,
} from '../../components/BoardDetail';

// Dnd-kit Imports
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  UniqueIdentifier,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper function to generate simple color from name
const getAvatarColor = (name: string): string => {
  const colors = [
    '#6B7280',
    '#9CA3AF',
    '#6366F1',
    '#8B5CF6',
    '#EC4899',
    '#F59E0B',
    '#10B981',
    '#3B82F6',
    '#14B8A6',
    '#F97316',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Định nghĩa các kiểu dữ liệu cơ bản
type Column = { id: string; name: string };
type Swimlane = { id: string; name: string; is_collapsed?: boolean };
type Task = {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  column_id: string;
  swimlane_id?: string;
  column?: any; // Dùng để lưu trữ ID hoặc Object của cột
  swimlane?: any; // Dùng để lưu trữ ID hoặc Object của swimlane
  columnId?: string;
  swimlaneId?: string;
  assigned_to?: {
    username: string;
    full_name?: string;
    _id?: string;
    id?: string;
    avatar_url?: string;
  };
  priority?: string;
  status?: string;
  start_date?: string;
  due_date?: string;
  estimate_hours?: number;
  created_by?: string | { username: string; full_name?: string; _id?: string };
  created_at?: string;
  updated_at?: string;
  order?: number;
  tags?: any[]; // Thêm tags vào Task type
};

type NewTaskState = {
  title: string;
  description: string;
  column_id: string;
  swimlane_id: string;
  priority?: string;
  estimate_hours?: number;
  start_date?: string;
  due_date?: string;
  nameTag?: string;
};
type BoardDetailProps = {
  boardId?: string;
  onBoardLoaded?: (board: any) => void;
  onBack?: () => void;
};

type TaskHistoryItem = {
  _id: string;
  task_id: {
    _id: string;
    title: string;
  };
  changed_by: {
    _id: string;
    username: string;
    email?: string;
  };
  change_type: string;
  createdAt: string;
};

// --- MOCK API CHO DRAG AND DROP ---
// Thay thế bằng
const updateTaskPosition = async (
  taskId: string,
  newColumnId: string | string | { _id: string; name?: string; order?: number } = '',
  newSwimlaneId: string | string | { _id: string; name?: string; order?: number } = '',
  newOrder: number,
  idBefore?: string,
  idAfter?: string,
) => {
  try {
    const response = await moveTaskApi(taskId, {
      new_column_id: typeof newColumnId === 'object' ? newColumnId._id : newColumnId,
      new_swimlane_id: typeof newSwimlaneId === 'object' ? newSwimlaneId._id : newSwimlaneId,
      prev_task_id: idBefore,
      next_task_id: idAfter,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to update task position:', error?.response?.data || error.message);
    throw error; // có thể return null nếu muốn im lặng
  }
};

// 💥 MOCK API CHO CỘT 💥
const updateColumnOrder = async (boardId: string, columnIds: string[]) => {
  try {
    const resul = await moveColumnApi(boardId, columnIds);
    return resul.data;
  } catch (error: any) {
    console.error('❌ Failed to update task position:', error?.response?.data || error.message);
    throw error; // có thể return null nếu muốn im lặng
  }
};

// 💥 THÊM MOCK API CHO SWIMLANE 💥
const updateSwimlaneOrder = async (boardId: string, swimlaneIds: string[]) => {
  try {
    const resul = await moveSwimlaneApi(boardId, swimlaneIds);
    return resul.data;
  } catch (error: any) {
    console.error('❌ Failed to update swimlan position:', error?.response?.data || error.message);
    throw error; // có thể return null nếu muốn im lặng
  }
};
// -----------------------------------

// --- 1️⃣ DROPPABLE CONTAINER CHO CỘT TRỐNG (GIỮ NGUYÊN) ---
const ColumnDroppable: React.FC<{
  columnId: string;
  swimlaneId: string;
  children: React.ReactNode;
}> = ({ columnId, swimlaneId, children }) => {
  // ID unique: "drop-SWIMLANE_ID-COLUMN_ID"
  const droppableId = `drop-${swimlaneId}-${columnId}` as UniqueIdentifier;

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { columnId, swimlaneId, isDroppableContainer: true }, // Thêm cờ để dễ kiểm tra
  });

  const style = {
    minHeight: '100px', // Đảm bảo có chiều cao tối thiểu
    padding: '0.5rem',
    border: isOver ? '2px dashed #007bff' : '2px dashed transparent',
    transition: 'border 0.2s',
    borderRadius: '4px',
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  );
};

// --- 2️⃣ SORTABLE ITEM CHO CỘT (GIỮ NGUYÊN) ---
const SortableColumnHeader: React.FC<{
  column: Column;
  children: React.ReactNode;
  className?: string; // Cho phép className tùy chỉnh
  style?: React.CSSProperties; // Cho phép style tùy chỉnh
}> = ({ column, children, className, style: customStyle }) => {
  // ID của cột phải là UniqueIdentifier
  const sortableId: UniqueIdentifier = column.id as UniqueIdentifier;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Có thể dùng để thay đổi style khi đang kéo
  } = useSortable({
    id: sortableId,
    data: { isColumn: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab', // Thêm cursor để báo hiệu kéo thả
    ...customStyle,
    opacity: isDragging ? 0.8 : 1, // Làm mờ khi đang kéo
    zIndex: isDragging ? 10 : 0, // Đưa lên trên khi đang kéo
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={className}>
      {children}
    </div>
  );
};
// -------------------------------------------

// --- 3️⃣ SORTABLE ITEM CHO SWIMLANE (MỚI) ---
const SortableSwimlaneRow: React.FC<{
  swimlane: Swimlane;
  children: React.ReactNode;
}> = ({ swimlane, children }) => {
  // ID của swimlane phải là UniqueIdentifier
  const sortableId: UniqueIdentifier = swimlane.id as UniqueIdentifier;

  // Không cho phép kéo thả swimlane mặc định
  const isDefault = swimlane.id === 'default';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
    data: { isSwimlane: true },
    // Chỉ kích hoạt useSortable nếu đây không phải là swimlane mặc định
    disabled: isDefault,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: isDefault ? 'default' : 'grab', // Thêm cursor để báo hiệu kéo thả
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  if (isDefault) {
    // Return default div without Dnd props if it's the default/unassigned lane
    return (
      <div className="swimlane-row" style={{ minWidth: 'fit-content' }}>
        {children}
      </div>
    );
  }

  // Nếu có thể kéo thả, trả về item có dnd
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="swimlane-row">
      {children}
    </div>
  );
};
// -------------------------------------------

const BoardDetail: React.FC<BoardDetailProps> = ({ boardId, onBoardLoaded, onBack }) => {
  const routeParams = useParams<{ id: string; taskId?: string }>();
  const id = boardId || routeParams.id;
  const taskIdFromUrl = routeParams.taskId;

  const navigate = useNavigate();
  const { confirm } = useModal();

  // State
  const [board, setBoard] = useState<any | null>(null);
  const [boardMembers, setBoardMembers] = useState<any[]>([]);

  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>({});
  const [me, setMe] = useState<any | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [isEditingTaskLoading, setIsEditingTaskLoading] = useState<boolean>(false);
  // columns là mảng objects trả về từ API, thứ tự này sẽ được thay đổi khi kéo thả cột
  const [columns, setColumns] = useState<any[]>([]);
  const [swimlanes, setSwimlanes] = useState<any[]>([]); // State này sẽ được cập nhật khi kéo thả swimlane
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState<NewTaskState>({
    title: '',
    description: '',
    column_id: '',
    swimlane_id: '',
    nameTag: '',
  });

  // Edit states
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Tag states
  const [allTags, setAllTags] = useState<any[]>([]);
  const [taskTags, setTaskTags] = useState<any[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [tagSearchInput, setTagSearchInput] = useState<string>('');
  const [showTagSuggestions, setShowTagSuggestions] = useState<boolean>(false);

  // Tag states for Create Task modal
  const [newTaskSelectedTagId, setNewTaskSelectedTagId] = useState<string>('');
  const [newTaskTagSearch, setNewTaskTagSearch] = useState<string>('');

  // Filter states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilterTagIds, setSelectedFilterTagIds] = useState<string[]>([]);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTagSearch, setFilterTagSearch] = useState<string>('');
  // NLP Search states - tách riêng
  const [nlpSearchQuery, setNlpSearchQuery] = useState<string>('');
  const [isSearchingNLP, setIsSearchingNLP] = useState(false);
  const [nlpSearchResults, setNlpSearchResults] = useState<Task[]>([]);

  // Tag Management Modal states
  const [showTagManager, setShowTagManager] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#007bff');

  // Collapsed swimlanes state
  const [collapsedSwimlanes, setCollapsedSwimlanes] = useState<Record<string, boolean>>({});

  // Active dragging task state for DragOverlay
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>('Board');

  // Add member modal state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('Thành viên');
  const [memberSearch, setMemberSearch] = useState<string>('');

  // Task history state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState<TaskHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const res = await axiosInstance.get('/user/findUsers?page=1&limit=1000');
        let usersData: any[] = [];
        if (Array.isArray(res.data)) usersData = res.data;
        else if (res.data?.users) usersData = res.data.users;
        else if (res.data?.data) usersData = res.data.data;
        const active = usersData.filter((u: any) => !u.deleted_at && u.status === 'active');
        setAllUsers(active);
      } catch (e) {
        setAllUsers([]);
      }
    };
    if (showAddMemberModal) loadAllUsers();
  }, [showAddMemberModal]);

  const currentMemberUserIds = useMemo(() => {
    return (boardMembers || [])
      .map((m: any) => m?.user_id?._id || m?.user_id?.id || m?.user_id)
      .filter(Boolean);
  }, [boardMembers]);

  const availableUsers = useMemo(() => {
    return (allUsers || []).filter((u: any) => !currentMemberUserIds.includes(u._id));
  }, [allUsers, currentMemberUserIds]);

  const filteredAvailableUsers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter(
      (u: any) =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q),
    );
  }, [availableUsers, memberSearch]);

  const handleAddMemberToBoard = async () => {
    if (!id || !selectedUserId) return;
    try {
      await axiosInstance.post(`/boardMember/board/${id}`, {
        user_id: selectedUserId,
        role_in_board: selectedRole,
      });
      const membersRes = await fetchBoardMembers(id);
      const members = membersRes?.data?.data || membersRes?.data || [];
      setBoardMembers(members);
      setShowAddMemberModal(false);
      setSelectedUserId('');
      setSelectedRole('Thành viên');
      setMemberSearch('');
      toast.success('Member added successfully');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Unable to add member';
      toast.error(msg);
    }
  };

  // Cấu hình Sensors cho Dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Cần kéo 8px trước khi bắt đầu drag
        // Hoặc giữ chuột 250ms - cho phép click nhanh hoạt động
        delay: 110,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Reload Tasks function
  const reloadTasks = async () => {
    if (!id) return;
    setTasksLoading(true);
    try {
      const tasksRes = await fetchTasksByBoard(id);
      const tasksData = (tasksRes?.data || tasksRes || []) as Task[];

      // Backend trả về task.tag (singular object), convert sang tags array
      const tasksWithTags = tasksData.map((task: any) => {
        const tags = task.tag ? [task.tag] : [];
        return { ...task, tags };
      });

      setTasks(tasksWithTags);
    } catch (e) {
      console.error('Failed to reload tasks:', e);
    } finally {
      setTasksLoading(false);
    }
  };

  // Reload task đang được edit (để cập nhật attachments sau khi upload)
  const reloadEditingTask = async (taskId: string) => {
    if (!taskId || !editingTask) return;
    try {
      const taskRes = await fetchTaskById(taskId);
      const taskData = taskRes?.data || taskRes;

      if (taskData) {
        // Cập nhật editingTask với dữ liệu mới (bao gồm attachments)
        setEditingTask({
          ...editingTask,
          ...taskData,
          attachments: taskData.attachments || [],
        } as any);
      }
    } catch (e) {
      console.error('Failed to reload editing task:', e);
    }
  };

  // Danh sách cột được chuẩn hóa (dùng để render)
  const columnList: Column[] = useMemo(() => {
    if (columns && Array.isArray(columns)) {
      // columns đã là mảng objects đã được sắp xếp theo state
      return columns.map((c: any) => ({ id: c._id || c.id, name: c.name })).filter((c) => c.id);
    }
    return [];
  }, [columns]); // Dependency là state columns

  // Danh sách swimlane được chuẩn hóa (chưa bao gồm mặc định)
  const baseSwimlaneList: Swimlane[] = useMemo(() => {
    if (swimlanes && Array.isArray(swimlanes)) {
      // swimlanes đã là mảng objects đã được sắp xếp theo state
      return swimlanes
        .map((s: any) => ({
          id: s._id || s.id,
          name: s.name,
          is_collapsed: s.is_collapsed,
        }))
        .filter((s) => s.id);
    }
    return [];
  }, [swimlanes]); // Dependency là state swimlanes

  // Lọc các task dựa trên các thẻ đã chọn và search query
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Nếu có NLP search query và có kết quả, dùng kết quả NLP
    if (nlpSearchQuery.trim() && nlpSearchResults.length > 0) {
      filtered = nlpSearchResults;
    } else if (nlpSearchQuery.trim()) {
      // Đang search NLP nhưng chưa có kết quả → trả về rỗng
      return [];
    } else {
      // Normal search: Lọc theo search query (tìm theo tên task)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (task) =>
            task.title?.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query),
        );
      }
    }

    // Lọc theo tags đã chọn (áp dụng cho cả normal và NLP search)
    if (selectedFilterTagIds.length > 0) {
      filtered = filtered.filter((task) => {
        if (!task.tags || task.tags.length === 0) return false;
        return task.tags.some((tag: any) => selectedFilterTagIds.includes(tag._id || tag.id));
      });
    }

    return filtered;
  }, [tasks, selectedFilterTagIds, searchQuery, nlpSearchQuery, nlpSearchResults]);

  // Lập bản đồ các task theo cột và swimlane
  const tasksByColumnAndSwimlane = useMemo(() => {
    const map: Record<string, Record<string, Task[]>> = {};

    filteredTasks.forEach((task: Task) => {
      const col = task.column_id || task.column || task.columnId;
      const cid = col?._id || col?.id || col || 'unknown';

      const swim = task.swimlane_id || task.swimlane || task.swimlaneId;
      // Chuẩn hóa ID: "" hoặc undefined => "default" cho việc nhóm UI
      const sid = swim?._id || swim?.id || swim || 'default';

      if (!map[sid]) map[sid] = {};
      if (!map[sid][cid]) map[sid][cid] = [];

      // Tasks nên được sắp xếp theo trường 'order' nếu có
      map[sid][cid].push(task);
    });

    // Sắp xếp các task trong mỗi ô
    for (const sid in map) {
      for (const cid in map[sid]) {
        map[sid][cid].sort((a, b) => (a.order || 9999) - (b.order || 9999));
      }
    }

    return map;
  }, [filteredTasks]);

  // Danh sách Swimlane HIỆU QUẢ (có thêm swimlane mặc định nếu cần)
  const effectiveSwimlaneList: Swimlane[] = useMemo(() => {
    const defaultSwimlaneId = 'default';
    const hasDefaultTasks =
      !!tasksByColumnAndSwimlane[defaultSwimlaneId] &&
      Object.values(tasksByColumnAndSwimlane[defaultSwimlaneId]).flat().length > 0;

    const finalLanes = baseSwimlaneList.filter((s) => s.id !== defaultSwimlaneId);

    if (hasDefaultTasks || finalLanes.length === 0) {
      // Nếu không có swimlane nào, vẫn hiển thị default
      const defaultLaneExists = finalLanes.some((l) => l.id === defaultSwimlaneId);

      const defaultLane: Swimlane = {
        id: defaultSwimlaneId,
        name: 'Other Tasks (No Swimlane)',
        is_collapsed: false,
      };

      if (!defaultLaneExists) {
        // Chèn default swimlane vào đầu danh sách hiển thị
        return [defaultLane, ...finalLanes];
      }
      return finalLanes; // Tránh trùng lặp nếu có default lane từ API
    }
    return finalLanes;
  }, [baseSwimlaneList, tasksByColumnAndSwimlane]);

  // Handle drag start to show task in overlay
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const taskId = active.id.toString();

      // Find the task being dragged
      const draggedTask = tasks.find((t) => (t._id || t.id) === taskId);
      if (draggedTask) {
        setActiveTask(draggedTask);
      }
    },
    [tasks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const activeId = active.id;
      const overId = over?.id;

      // Clear active task
      setActiveTask(null);

      if (!overId || activeId === overId) {
        return;
      }
      if (active.data.current?.isSwimlane) {
        // Tìm index của swimlane
        // Ta sắp xếp mảng swimlanes GỐC (state)
        const oldIndex = swimlanes.findIndex((s) => (s._id || s.id) === activeId);
        const newIndex = swimlanes.findIndex((s) => (s._id || s.id) === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Cập nhật state local ngay lập tức
          const newSwimlanes = arrayMove(swimlanes, oldIndex, newIndex);
          setSwimlanes(newSwimlanes); // Cập nhật state swimlanes gốc

          // Lấy danh sách ID đã sắp xếp để gọi API
          const swimlaneIdsInOrder = newSwimlanes.map((s) => s._id || s.id).filter(Boolean);

          // Gọi API (chưa có API thật, dùng mock)
          if (id && swimlaneIdsInOrder.length > 0) {
            updateSwimlaneOrder(id, swimlaneIdsInOrder).catch((e) => {
              console.error('Failed to update swimlane order:', e);
              // TODO: Xử lý rollback state nếu cần
            });
          }
        }
        return; // Dừng xử lý các loại kéo thả khác nếu là kéo thả swimlane
      }

      if (active.data.current?.isColumn) {
        // Tìm index của cột
        const oldIndex = columns.findIndex((c) => (c._id || c.id) === activeId);
        const newIndex = columns.findIndex((c) => (c._id || c.id) === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          // Cập nhật state local ngay lập tức
          const newColumns = arrayMove(columns, oldIndex, newIndex);
          setColumns(newColumns);

          // Lấy danh sách ID đã sắp xếp để gọi API
          const columnIdsInOrder = newColumns.map((c) => c._id || c.id).filter(Boolean);

          // Gọi API (chưa có API thật, dùng mock)
          if (id && columnIdsInOrder.length > 0) {
            // Không cần await để tránh block UI, xử lý lỗi trong API call
            updateColumnOrder(id, columnIdsInOrder).catch((e) => {
              console.error('Failed to update column order:', e);
              // TODO: Xử lý rollback state nếu cần
            });
          }
        }
        return; // Dừng xử lý Task nếu là kéo thả cột
      }

      // 1️⃣ Tìm task đang kéo
      const activeTask = tasks.find((t) => (t._id || t.id) === activeId);
      if (!activeTask) return;

      let targetColumnId: string = '';
      let targetSwimlaneId: string = '';
      let finalOverId: UniqueIdentifier = overId;

      // 2️⃣ Xác định cell đích và lấy ID dạng chuỗi
      if (overId.toString().startsWith('drop-')) {
        // Case A: Drop vào ô trống (ColumnDroppable)
        const parts = overId.toString().split('-'); // ["drop", swimlaneId, columnId]
        targetSwimlaneId = parts[1];
        targetColumnId = parts[2];
      } else {
        // Case B: Drop vào task khác (TaskCard)
        const overTask = tasks.find((t) => (t._id || t.id) === overId);
        if (!overTask) return;

        targetColumnId = overTask.column_id || overTask.column || overTask.columnId || 'unknown';
        targetSwimlaneId =
          overTask.swimlane_id || overTask.swimlane || overTask.swimlaneId || 'default';
      }

      // 3️⃣ Chuẩn bị dữ liệu và mảng mới
      const oldTasks = [...tasks]; // Backup for rollback

      // Tìm index của active task và over task TRƯỚC KHI remove
      const activeIndex = tasks.findIndex((t) => (t._id || t.id) === activeId);
      const overIndex = overId.toString().startsWith('drop-')
        ? -1
        : tasks.findIndex((t) => (t._id || t.id) === overId);

      let newTasks = [...tasks];

      // 1. Loại bỏ task đang kéo khỏi vị trí cũ trong mảng tasks
      newTasks = newTasks.filter((t) => (t._id || t.id) !== activeId);

      // 2. Cập nhật thuộc tính column và swimlane cho task đang kéo
      const taskToUpdate: Task = {
        ...activeTask,
        column_id: targetColumnId,
        swimlane_id: targetSwimlaneId === 'default' ? undefined : targetSwimlaneId,
        column: targetColumnId,
        swimlane: targetSwimlaneId,
      };

      // 3. TÌM VỊ TRÍ CHÈN CHÍNH XÁC trong mảng tasks TỔNG THỂ
      let insertIndex = newTasks.length;

      if (overId.toString().startsWith('drop-')) {
        // Drop vào ô trống: Chèn SAU task cuối cùng của cell đích
        const lastTaskInTargetCellIndex = newTasks.reduce((latestIndex, task, index) => {
          const currentColId = task.column_id || task.column || task.columnId;
          const currentSwimId = task.swimlane_id || task.swimlane || task.swimlaneId || 'default';

          if (currentColId === targetColumnId && currentSwimId === targetSwimlaneId) {
            return index;
          }
          return latestIndex;
        }, -1);

        if (lastTaskInTargetCellIndex !== -1) {
          insertIndex = lastTaskInTargetCellIndex + 1;
        } else {
          insertIndex = newTasks.length;
        }
      } else {
        // Drop vào task khác
        const newOverIndex = newTasks.findIndex((t) => (t._id || t.id) === finalOverId);
        if (newOverIndex !== -1) {
          // Nếu kéo xuống (activeIndex < overIndex), chèn SAU task đích
          // Nếu kéo lên (activeIndex > overIndex), chèn TRƯỚC task đích
          if (activeIndex !== -1 && overIndex !== -1 && activeIndex < overIndex) {
            insertIndex = newOverIndex + 1; // Kéo xuống: chèn sau
          } else {
            insertIndex = newOverIndex; // Kéo lên: chèn trước
          }
        }
      }

      // 4. Chèn lại task vào vị trí mới (thay đổi thứ tự trong mảng tổng)
      newTasks.splice(insertIndex, 0, taskToUpdate);

      // 5️⃣ Cập nhật state để UI render ngay
      setTasks(newTasks);

      // 6️⃣ Gọi API cập nhật vị trí và thứ tự (SỬA LỖI LẤY ID LÂN CẬN)

      // Lọc tất cả tasks trong cell đích (Đã sắp xếp)
      const tasksInFinalCell = newTasks.filter((t) => {
        const currentColId = t.column_id || t.column || t.columnId;
        const currentSwimId = t.swimlane_id || t.swimlane || t.swimlaneId || 'default';
        return currentColId === targetColumnId && currentSwimId === targetSwimlaneId;
      });

      // Vị trí MỚI của task đang kéo trong cell đích (Order)
      const finalNewOrder = tasksInFinalCell.findIndex((t) => (t._id || t.id) === activeId);

      // Chuẩn hóa swimlane ID cho API
      const finalSwimlaneId = targetSwimlaneId === 'default' ? '' : targetSwimlaneId;

      // Lấy ID của task phía trước và phía sau TỪ tasksInFinalCell
      let idBefore: string | undefined = undefined;
      let idAfter: string | undefined = undefined;

      if (finalNewOrder !== -1) {
        // Chỉ xử lý nếu tìm thấy task trong mảng đích
        // Lấy ID của task phía trước (tại index finalNewOrder - 1)
        if (finalNewOrder > 0) {
          const beforeTask = tasksInFinalCell[finalNewOrder - 1];
          idBefore = beforeTask ? beforeTask._id || beforeTask.id : undefined;
        }

        // Lấy ID của task phía sau (tại index finalNewOrder + 1)
        if (finalNewOrder < tasksInFinalCell.length - 1) {
          const afterTask = tasksInFinalCell[finalNewOrder + 1];
          idAfter = afterTask ? afterTask._id || afterTask.id : undefined;
        }

        // Gọi API với targetColumnId
        updateTaskPosition(
          activeId.toString(),
          targetColumnId,
          finalSwimlaneId,
          finalNewOrder,
          idBefore,
          idAfter,
        )
          .then(() => {
            // Reload tasks sau khi cập nhật thành công để đồng bộ với backend
            reloadTasks();
          })
          .catch((e) => {
            // Rollback UI nếu API thất bại
            setTasks(oldTasks);
            // Sau đó reload để đảm bảo sync với server
            setTimeout(() => reloadTasks(), 500);
          });
      }
    },
    [tasks, columns, swimlanes, id, reloadTasks],
  );
  // THÊM `swimlanes` VÀO DEPENDENCIES

  // Load dữ liệu
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setTasksLoading(true);
      try {
        const [boardRes, columnsRes, swimlanesRes, meRes, membersRes] = await Promise.all([
          fetchBoardById(id),
          fetchColumnsByBoard(id),
          fetchSwimlanesByBoard(id),
          axiosInstance.get('/user/me'),
          fetchBoardMembers(id),
        ]);

        const b = boardRes?.data || boardRes;
        setBoard(b);
        try {
          onBoardLoaded && onBoardLoaded(b);
        } catch (e) {
          /* silent fail */
        }

        // Set current user
        const userData = meRes.data?.data || null;
        setMe(userData);

        // Set board members (filter out current user)
        const members = membersRes?.data?.data || membersRes?.data || [];
        const otherMembers = members.filter((m: any) => {
          const memberId = m.user_id?._id || m.user_id?.id || m.user_id;
          const currentUserId = userData?._id || userData?.id;
          return memberId !== currentUserId;
        });
        setBoardMembers(members);

        // Lưu columns vào state (có thể đã có order từ API)
        setColumns(columnsRes?.data || columnsRes || []);

        // Lưu swimlanes vào state
        setSwimlanes(swimlanesRes?.data || swimlanesRes || []);
        // Tải tasks riêng để có thể hiện bố cục trước khi có dữ liệu task
        reloadTasks();
      } catch (e) {
        console.error('Failed to load board data:', e);
        setBoard(null);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, onBoardLoaded]);

  // Fetch avatars for board members
  useEffect(() => {
    const fetchAvatars = async () => {
      const avatars: Record<string, string> = {};
      for (const member of boardMembers) {
        const userId = member.user_id?._id || member.user_id?.id || member.user_id;
        if (userId && !memberAvatars[userId]) {
          try {
            const result = await fetchAvatarUser(String(userId));
            if (result?.avatar_url) {
              avatars[userId] = result.avatar_url;
            }
          } catch (error) { }
        }
      }
      if (Object.keys(avatars).length > 0) {
        setMemberAvatars((prev) => ({ ...prev, ...avatars }));
      }
    };

    if (boardMembers.length > 0) {
      fetchAvatars();
    }
  }, [boardMembers]);

  // Load all tags by board
  useEffect(() => {
    const loadTags = async () => {
      if (!id) return;
      try {
        // Sử dụng API lấy tags theo board
        const res = await fetchTagsByBoard(id);
        const tagsData = res?.data?.data || res?.data || res || [];
        setAllTags(tagsData);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    };
    loadTags();
  }, [id]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.btn-filter') && !target.closest('.toolbar-actions')) {
          setShowFilterDropdown(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilterDropdown]);

  // NLP Search handler - chỉ search khi nhấn Enter
  const handleNLPSearch = async () => {
    if (!nlpSearchQuery.trim()) {
      setNlpSearchResults([]);
      return;
    }

    setIsSearchingNLP(true);
    try {
      // Lấy board_id hiện tại để filter
      const boardId = id || board?._id || board?.id;
      const response = await searchTasksByNLP(nlpSearchQuery, boardId);
      if (response.status === 'success' && response.tasks) {
        setNlpSearchResults(response.tasks);
        toast.success(`Found ${response.tasks.length} task(s)`);
      } else {
        setNlpSearchResults([]);
        toast.error('No tasks found');
      }
    } catch (error: any) {
      console.error('NLP Search error:', error);
      setNlpSearchResults([]);
      toast.error(error?.response?.data?.error || 'Unable to search. Please try again.');
    } finally {
      setIsSearchingNLP(false);
    }
  };

  // Load task tags when editing task
  useEffect(() => {
    if (editingTask && (editingTask._id || editingTask.id)) {
      // Backend trả về task.tag (singular), convert sang array
      const tags = (editingTask as any).tag ? [(editingTask as any).tag] : [];
      setTaskTags(tags);
    } else {
      setTaskTags([]);
    }
  }, [editingTask]);

  // Auto-open task modal when taskId is in URL
  useEffect(() => {
    if (taskIdFromUrl && tasks.length > 0) {
      const task = tasks.find((t) => (t._id || t.id) === taskIdFromUrl);
      if (task && !editingTask) {
        // Only open if not already editing a task
        setEditingTask({
          _id: task._id || task.id,
          title: task.title,
          description: task.description || '',
          column_id: task.column_id,
          swimlane_id: task.swimlane_id,
          assigned_to: task.assigned_to,
          priority: task.priority,
          status: task.status,
          start_date: task.start_date,
          due_date: task.due_date,
          estimate_hours: task.estimate_hours,
          created_by: task.created_by,
          created_at: task.created_at,
          updated_at: task.updated_at,
          tags: task.tags,
          tag: (task as any).tag,
        } as any);
        setShowEditTask(true);
      }
    }
  }, [taskIdFromUrl, tasks]);

  // Reload tags when Tag Manager modal opens
  useEffect(() => {
    if (showTagManager) {
      loadAllTags();
    }
  }, [showTagManager]);

  // Initialize collapsed states
  useEffect(() => {
    const initialCollapsed: Record<string, boolean> = {};
    baseSwimlaneList.forEach((swimlane) => {
      initialCollapsed[swimlane.id] = swimlane.is_collapsed ?? false;
    });
    setCollapsedSwimlanes(initialCollapsed);
  }, [swimlanes, baseSwimlaneList]);

  // Toggle swimlane collapse
  const toggleSwimlane = (swimlaneId: string) => {
    setCollapsedSwimlanes((prev) => ({
      ...prev,
      [swimlaneId]: !prev[swimlaneId],
    }));
  };

  // Tag handlers
  const handleAddTag = async () => {
    if (!selectedTagId || !editingTask || !(editingTask._id || editingTask.id)) return;

    try {
      const taskId = editingTask._id || editingTask.id || '';
      await addTagToTask(taskId, selectedTagId);

      // Backend chỉ cho phép 1 tag, nên sau khi add thành công, update local state
      const addedTag = allTags.find((t) => (t._id || t.id) === selectedTagId);
      if (addedTag) {
        setTaskTags([addedTag]);
        // Update editingTask để có tag mới
        setEditingTask({ ...editingTask, tag: addedTag } as any);
      }
      setSelectedTagId('');

      // Reload all tasks to update UI on board
      await reloadTasks();

      toast.success((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Tag added to task!</div>
            <div className="text-sm text-gray-600 mt-1">Tag assigned successfully.</div>
          </div>
        </div>
      ));
    } catch (error: any) {
      console.error('Failed to add tag:', error);
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Failed to add tag!</div>
            <div className="text-sm text-gray-600 mt-1">
              {error.response?.data?.message || 'Please try again later.'}
            </div>
          </div>
        </div>
      ));
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!editingTask || !(editingTask._id || editingTask.id)) return;

    try {
      const taskId = editingTask._id || editingTask.id || '';
      await removeTagFromTask(taskId, tagId);

      // Update local state - remove tag and reset tag selection
      setTaskTags([]);
      setEditingTask({ ...editingTask, tag: null } as any);
      setTagSearchInput('');
      setSelectedTagId('');

      // Reload all tasks to update UI on board
      await reloadTasks();
    } catch (error: any) {
      console.error('Failed to remove tag:', error);
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Failed to remove tag!</div>
            <div className="text-sm text-gray-600 mt-1">
              {error.response?.data?.message || 'Please try again later.'}
            </div>
          </div>
        </div>
      ));
    }
  };

  // Tag Management CRUD handlers
  const loadAllTags = async () => {
    if (!id) return;
    try {
      // Lấy tags theo board
      const res = await fetchTagsByBoard(id);
      const tagsData = res?.data?.data || res?.data || res || [];
      setAllTags(tagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Invalid tag name!</div>
            <div className="text-sm text-gray-600 mt-1">Please enter a tag name.</div>
          </div>
        </div>
      ));
      return;
    }

    if (!id) {
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Invalid board ID!</div>
            <div className="text-sm text-gray-600 mt-1">Please check again.</div>
          </div>
        </div>
      ));
      return;
    }

    try {
      const response = await createTag({
        name: newTagName.trim(),
        color: newTagColor,
        boardId: id,
      });
      setNewTagName('');
      setNewTagColor('#007bff');
      await loadAllTags();
      toast.success((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Tag created successfully!</div>
            <div className="text-sm text-gray-600 mt-1">A new tag has been added to the board.</div>
          </div>
        </div>
      ));
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Failed to create tag!</div>
            <div className="text-sm text-gray-600 mt-1">
              {error.response?.data?.message || 'Please try again later.'}
            </div>
          </div>
        </div>
      ));
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTag.name.trim()) {
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Invalid tag name!</div>
            <div className="text-sm text-gray-600 mt-1">Please enter a tag name.</div>
          </div>
        </div>
      ));
      return;
    }

    try {
      const tagId = editingTag._id || editingTag.id;
      await updateTag(tagId, {
        name: editingTag.name.trim(),
        color: editingTag.color,
      });
      setEditingTag(null);
      await loadAllTags();
      toast.success((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Tag updated successfully!</div>
            <div className="text-sm text-gray-600 mt-1">Tag information has been saved.</div>
          </div>
        </div>
      ));
    } catch (error: any) {
      console.error('Failed to update tag:', error);
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Failed to update tag!</div>
            <div className="text-sm text-gray-600 mt-1">
              {error.response?.data?.message || 'Please try again later.'}
            </div>
          </div>
        </div>
      ));
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    const confirmed = await confirm({
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this tag? It will be removed from all tasks.',
      variant: 'error' as const,
    });

    if (!confirmed) return;

    try {
      await deleteTag(tagId);
      await loadAllTags();
      toast.success((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Tag deleted successfully!</div>
            <div className="text-sm text-gray-600 mt-1">Tag has been removed from the board.</div>
          </div>
        </div>
      ));
    } catch (error: any) {
      console.error('Failed to delete tag:', error);
      toast.error(
        <div>
          <div className="font-semibold mb-1">Failed to delete tag!</div>
          <div className="text-sm text-gray-500">
            {error.response?.data?.message || 'Please try again later.'}
          </div>
        </div>,
      );
    }
  };

  // Các hàm CRUD (giữ nguyên)

  const handleCreateTask = async () => {
    if (!id || !newTask.title || !newTask.column_id) return;

    const swimlane_id =
      newTask.swimlane_id === 'default' || newTask.swimlane_id === ''
        ? undefined
        : newTask.swimlane_id;

    try {
      const payload: any = {
        board_id: id,
        column_id: newTask.column_id,
        swimlane_id: swimlane_id,
        title: newTask.title,
        description: newTask.description,
      };

      // Add optional fields if provided
      if (newTask.priority) {
        payload.priority = newTask.priority;
      }

      if (newTask.estimate_hours) {
        payload.estimate_hours = newTask.estimate_hours;
      }

      if (newTask.start_date) {
        payload.start_date = newTask.start_date;
      }

      if (newTask.due_date) {
        payload.due_date = newTask.due_date;
      }

      // Handle tag: prioritize selected tag ID, fallback to nameTag for new tags
      if (newTaskSelectedTagId) {
        // User selected an existing tag from the list
        payload.tag_id = newTaskSelectedTagId;
      } else if (newTask.nameTag && newTask.nameTag.trim()) {
        // User typed a new tag name
        payload.nameTag = newTask.nameTag.trim();
      }

      const createdTask = await createTask(payload);

      // If tag_id was provided, add it to the task after creation
      if (newTaskSelectedTagId && createdTask?.data?._id) {
        try {
          await addTagToTask(createdTask.data._id, newTaskSelectedTagId);
        } catch (tagError) {
          console.error('Failed to add tag to task:', tagError);
          toast.error((t) => (
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Warning!</div>
                <div className="text-sm text-gray-600 mt-1">
                  Task was created but tagging failed.
                </div>
              </div>
            </div>
          ));
        }
      }

      setShowNewTask(false);
      setNewTask({
        title: '',
        description: '',
        column_id: '',
        swimlane_id: '',
        nameTag: '',
      });
      setNewTaskSelectedTagId('');
      setNewTaskTagSearch('');

      // Reload tasks và tags để cập nhật danh sách
      await reloadTasks();
      await loadAllTags();
    } catch (e) {
      console.error(e);
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Failed to create task!</div>
            <div className="text-sm text-gray-600 mt-1">Please try again later.</div>
          </div>
        </div>
      ));
    }
  };

  const openEditTaskModal = async (task: Task) => {
    const taskId = task._id || task.id;
    setIsEditingTaskLoading(true);

    // Load task chi tiết từ API để có đầy đủ thông tin (bao gồm attachments)
    try {
      const taskRes = await fetchTaskById(taskId || '');
      const taskData = taskRes?.data || taskRes || task;

      setEditingTask({
        _id: taskId,
        title: taskData.title || task.title,
        description: taskData.description || task.description || '',
        column_id: taskData.column_id || task.column_id,
        swimlane_id: taskData.swimlane_id || task.swimlane_id,
        assigned_to: taskData.assigned_to || task.assigned_to,
        priority: taskData.priority || task.priority,
        status: taskData.status || task.status,
        start_date: taskData.start_date || task.start_date,
        due_date: taskData.due_date || task.due_date,
        estimate_hours: taskData.estimate_hours || task.estimate_hours,
        created_by: taskData.created_by || task.created_by,
        created_at: taskData.created_at || task.created_at,
        updated_at: taskData.updated_at || task.updated_at,
        tags: taskData.tags || task.tags, // Copy tags từ task gốc
        tag: taskData.tag || (task as any).tag, // Copy tag từ task gốc (backend format)
        attachments: taskData.attachments || [], // Load attachments từ API
      } as any);
    } catch (error) {
      console.error('Failed to load task details:', error);
      // Fallback to task data from props if API fails
      setEditingTask({
        _id: taskId,
        title: task.title,
        description: task.description || '',
        column_id: task.column_id,
        swimlane_id: task.swimlane_id,
        assigned_to: task.assigned_to,
        priority: task.priority,
        status: task.status,
        start_date: task.start_date,
        due_date: task.due_date,
        estimate_hours: task.estimate_hours,
        created_by: task.created_by,
        created_at: task.created_at,
        updated_at: task.updated_at,
        tags: task.tags,
        tag: (task as any).tag,
        attachments: [],
      } as any);
    }

    setShowEditTask(true);

    // Update URL without reload using History API
    if (id && taskId) {
      const newUrl = `/admin/project/${id}/${taskId}`;
      window.history.pushState({}, '', newUrl);
    }
    setIsEditingTaskLoading(false);
  };

  const closeEditTaskModal = () => {
    setShowEditTask(false);
    setEditingTask(null);
    setSelectedTagId('');
    setTagSearchInput('');
    setIsEditingTaskLoading(false);

    // Restore URL without reload using History API
    if (id) {
      const newUrl = `/admin/project/${id}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editingTask._id || !editingTask.title) return;

    try {
      const dataToUpdate: any = {
        title: editingTask.title,
        description: editingTask.description,
      };

      if (editingTask.priority) dataToUpdate.priority = editingTask.priority;
      if (editingTask.status) dataToUpdate.status = editingTask.status;
      // Always include start_date and due_date (even if undefined/null) to allow clearing dates
      dataToUpdate.start_date = editingTask.start_date || null;
      dataToUpdate.due_date = editingTask.due_date || null;
      if (editingTask.estimate_hours !== undefined)
        dataToUpdate.estimate_hours = editingTask.estimate_hours;

      // Thêm assigned_to vào dataToUpdate
      if (editingTask.assigned_to) {
        dataToUpdate.assigned_to = editingTask.assigned_to._id || editingTask.assigned_to.id;
      } else {
        // Nếu unassign, gửi null
        dataToUpdate.assigned_to = null;
      }

      await updateTask(editingTask._id, dataToUpdate);

      // Handle tag: either select existing tag OR create new tag
      const newTagName = tagSearchInput.trim();

      if (selectedTagId) {
        // Case 1: User selected an existing tag from suggestions
        try {
          await addTagToTask(editingTask._id, selectedTagId);
        } catch (tagError) {
          console.error('Failed to add tag:', tagError);
        }
      } else if (newTagName) {
        // Case 2: User typed a tag name (might be new or existing)
        try {
          // Check if tag with this name already exists
          const existingTag = allTags.find(
            (t) => t.name.toLowerCase() === newTagName.toLowerCase(),
          );

          if (existingTag) {
            // Tag exists, just add it to task
            await addTagToTask(editingTask._id, existingTag._id || existingTag.id);
          } else {
            // Tag doesn't exist, create new tag and add to task
            const newTagResponse = await createTag({
              name: newTagName,
              color: '#007bff',
              boardId: id,
            });
            const newTagId =
              newTagResponse?.data?._id ||
              newTagResponse?.data?.id ||
              newTagResponse?._id ||
              newTagResponse?.id;

            if (newTagId) {
              await addTagToTask(editingTask._id, newTagId);
              // Reload tags list
              await loadAllTags();
            }
          }
        } catch (tagError) {
          console.error('Failed to create/add tag:', tagError);
        }
      }

      toast.success((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Task updated successfully!</div>
            <div className="text-sm text-gray-600 mt-1">Task information has been saved.</div>
          </div>
        </div>
      ));

      closeEditTaskModal();
      await reloadTasks();
    } catch (e: any) {
      console.error(e);
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Failed to update task!</div>
            <div className="text-sm text-gray-600 mt-1">
              {e.response?.data?.message || 'Please try again later.'}
            </div>
          </div>
        </div>
      ));
    }
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    if (!taskId) return;

    const confirmed = await confirm({
      title: 'Confirm Delete Task',
      message: `Are you sure you want to delete task "${taskTitle}"?`,
      variant: 'error' as const,
    });

    if (!confirmed) return;

    try {
      await deleteTask(taskId);
      toast.success((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Task deleted successfully!</div>
            <div className="text-sm text-gray-600 mt-1">
              The task has been removed from the board.
            </div>
          </div>
        </div>
      ));
      await reloadTasks();
    } catch (e: any) {
      console.error(e);
      toast.error((t) => (
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="font-semibold text-gray-900">Failed to delete task!</div>
            <div className="text-sm text-gray-600 mt-1">
              {e.response?.data?.message || 'Please try again later.'}
            </div>
          </div>
        </div>
      ));
    }
  };

  const handleDeleteBoard = async () => {
    if (!id) return;

    const confirmed = await confirm({
      title: 'Confirm Delete Board',
      message: 'Are you sure you want to delete this board? This action cannot be undone.',
      variant: 'error' as const,
    });

    if (!confirmed) return;

    try {
      await deleteBoard(id);
      toast.success('Board deleted successfully!');
      if (onBack) {
        onBack();
      } else {
        navigate('/dashboard/projects');
      }
    } catch (error: any) {
      console.error('Failed to delete board:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete board. Please try again.');
    }
  };

  const handleOpenTaskHistory = async () => {
    const taskId = editingTask?._id || editingTask?.id;

    if (!taskId) {
      toast.error('Please open a task detail to view change history.');
      return;
    }

    try {
      setLoadingHistory(true);
      setShowHistoryModal(true);

      const res = await fetchTaskHistory(taskId);
      const items: TaskHistoryItem[] = res?.data || res?.history || res || [];

      setHistoryItems(items);
    } catch (e: any) {
      console.error('Failed to load task history:', e);
      const msg = e?.response?.data?.message || 'Unable to load task history. Please try again.';
      toast.error(msg);
      setHistoryItems([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Hàm render Board Content (ĐÃ CẬP NHẬT KÉO THẢ SWIMLANE)
  const renderBoardContent = (lanes: Swimlane[]) => {
    // Chỉ lấy ID của các swimlane có thể kéo thả (không phải "default")
    const sortableSwimlaneIds: UniqueIdentifier[] = lanes
      .filter((l) => l.id !== 'default')
      .map((l) => l.id as UniqueIdentifier);

    return (
      // DndContext bao bọc toàn bộ khu vực kéo thả
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board-with-swimlanes">
          {/* Header cột */}
          <div className="swimlane-header555">
            <div> Swimlane</div>

            <SortableContext
              // Lấy ID của các cột để làm items
              items={columnList.map((c) => c.id as UniqueIdentifier)}
              strategy={verticalListSortingStrategy} // Dùng verticalListSortingStrategy hoặc HorizontalListSortingStrategy
            >
              {columnList.map((col) => (
                // 💥 SỬ DỤNG SORTABLE COLUMN HEADER 💥
                <SortableColumnHeader key={col.id} column={col} className="sas">
                  {col.name}
                </SortableColumnHeader>
              ))}
            </SortableContext>
          </div>

          {/* Swimlanes - BAO BỌC BẰNG SORTABLE CONTEXT (MỚI) */}
          <SortableContext
            items={sortableSwimlaneIds} // Danh sách ID swimlane có thể kéo
            strategy={verticalListSortingStrategy} // Sắp xếp theo chiều dọc
          >
            {lanes.map((swimlane) => (
              // 💥 SỬ DỤNG SORTABLE SWIMLANE ROW 💥
              <SortableSwimlaneRow key={swimlane.id} swimlane={swimlane}>
                {/* Nội dung của swimlane-row */}
                {/* Tên swimlane + collapse button */}
                <div className="swimlane-name">
                  <img
                    src={collapsedSwimlanes[swimlane.id] ? '/icons/down.png' : '/icons/up.png'}
                    alt={collapsedSwimlanes[swimlane.id] ? 'Expand' : 'Collapse'}
                    onClick={() => toggleSwimlane(swimlane.id)}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{ width: '32px', height: '32px', cursor: 'pointer' }}
                  />
                  <span>{swimlane.name}</span>
                </div>

                {/* Các cột trong swimlane */}
                {!collapsedSwimlanes[swimlane.id] &&
                  columnList.map((col) => {
                    const tasksInCell = tasksByColumnAndSwimlane[swimlane.id]?.[col.id] || [];

                    // Tạo mảng ID tasks cho SortableContext
                    const sortableTaskIds: UniqueIdentifier[] = tasksInCell.map(
                      (t, idx) =>
                        (t._id ||
                          t.id ||
                          `temp-${col.id}-${swimlane.id}-${idx}`) as UniqueIdentifier,
                    );

                    return (
                      <div key={col.id} className="board-col" style={{ minWidth: '270px' }}>
                        <div className="board-col__body">
                          {/* 💥 SỬ DỤNG ColumnDroppable BAO BỌC SortableContext 💥 */}
                          <ColumnDroppable columnId={col.id} swimlaneId={swimlane.id}>
                            <SortableContext
                              items={sortableTaskIds}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="board-cards">
                                {tasksLoading && tasksInCell.length === 0 ? (
                                  <>
                                    {[1, 2].map((i) => (
                                      <div
                                        key={i}
                                        className="board-card bg-gray-50 border border-gray-200"
                                        style={{ minHeight: 90 }}
                                      >
                                        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                                        <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
                                        <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                                      </div>
                                    ))}
                                  </>
                                ) : (
                                  tasksInCell.map((task, idx) => {
                                    const taskId = task._id || task.id || `temp-${idx}-${col.id}`;
                                    return (
                                      <TaskCard
                                        key={taskId}
                                        task={task}
                                        index={idx}
                                        columnId={col.id}
                                        swimlaneId={swimlane.id}
                                        onEdit={openEditTaskModal}
                                        onDelete={handleDeleteTask}
                                        members={boardMembers}
                                        reloadTasks={reloadTasks}
                                        onReloadEditingTask={reloadEditingTask}
                                      />
                                    );
                                  })
                                )}
                              </div>
                            </SortableContext>
                          </ColumnDroppable>
                        </div>

                        <div className="board-col__footer">
                          <button
                            className="btn-create"
                            onClick={() => {
                              setShowNewTask(true);
                              setNewTask((nt) => ({
                                ...nt,
                                column_id: col.id,
                                swimlane_id: swimlane.id === 'default' ? '' : swimlane.id,
                              }));
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            Create
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </SortableSwimlaneRow>
            ))}
          </SortableContext>
        </div>

        {/* DragOverlay to show task while dragging */}
        <DragOverlay>
          {activeTask ? (
            <div
              className="board-card"
              style={{
                opacity: 0.9,
                cursor: 'grabbing',
              }}
            >
              <div className="board-card__header">
                <div className="board-card__title">{activeTask.title}</div>
              </div>
              {activeTask.description && (
                <div className="board-card__desc">{activeTask.description}</div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };
  // Hàm render Simple Board Content (GIỮ NGUYÊN)
  const renderSimpleBoardContent = () => {
    const defaultSwimlaneId = 'default'; // ID mặc định cho Simple Board

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="simple-board"
          style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex' }}
        >
          {/* 💥 SORTABLE CONTEXT CHO COLUMN 💥 */}
          <SortableContext
            items={columnList.map((c) => c.id as UniqueIdentifier)}
            strategy={verticalListSortingStrategy}
          >
            {columnList.map((col) => {
              const tasksInColumn = tasksByColumnAndSwimlane[defaultSwimlaneId]?.[col.id] || [];

              // Tạo mảng ID tasks cho SortableContext
              const sortableTaskIds: UniqueIdentifier[] = tasksInColumn.map(
                (t, idx) =>
                  (t._id ||
                    t.id ||
                    `temp-${col.id}-${defaultSwimlaneId}-${idx}`) as UniqueIdentifier,
              );

              return (
                // 💥 SỬ DỤNG SORTABLE COLUMN HEADER để bao bọc cột 💥
                <SortableColumnHeader
                  key={col.id}
                  column={col}
                  className="board-column-wrapper"
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'top',
                    marginRight: '8px',
                    minWidth: '250px',
                  }}
                >
                  <div className="board-col" style={{ minWidth: '250px' }}>
                    <div className="board-col-title">
                      <h4>{col.name}</h4>
                    </div>
                    <div className="board-col__body">
                      {/* 💥 SỬ DỤNG ColumnDroppable BAO BỌC SortableContext 💥 */}
                      <ColumnDroppable columnId={col.id} swimlaneId={defaultSwimlaneId}>
                        <SortableContext
                          items={sortableTaskIds}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="board-cards">
                            {tasksLoading && tasksInColumn.length === 0 ? (
                              <>
                                {[1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className="board-card bg-gray-50 border border-gray-200"
                                    style={{ minHeight: 90 }}
                                  >
                                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                                    <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
                                    <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
                                  </div>
                                ))}
                              </>
                            ) : (
                              tasksInColumn.map((task, idx) => (
                                <TaskCard
                                  key={task._id || task.id}
                                  task={task}
                                  index={idx}
                                  columnId={col.id}
                                  swimlaneId={defaultSwimlaneId}
                                  onEdit={openEditTaskModal}
                                  onDelete={handleDeleteTask}
                                  members={boardMembers}
                                  reloadTasks={reloadTasks}
                                />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </ColumnDroppable>
                    </div>
                    <div className="board-col__footer">
                      <button
                        className="btn-create"
                        onClick={() => {
                          setShowNewTask(true);
                          setNewTask((nt) => ({
                            ...nt,
                            column_id: col.id,
                            swimlane_id: '',
                          }));
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </SortableColumnHeader>
              );
            })}
          </SortableContext>
        </div>

        {/* DragOverlay to show task while dragging */}
        <DragOverlay>
          {activeTask ? (
            <div
              className="board-card"
              style={{
                opacity: 0.9,
                cursor: 'grabbing',
              }}
            >
              <div className="board-card__header">
                <div className="board-card__title">{activeTask.title}</div>
              </div>
              {activeTask.description && (
                <div className="board-card__desc">{activeTask.description}</div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  };

  return (
    <div>
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {/* Header skeleton (simple) */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-52 bg-gray-200 rounded" />
            </div>
            <div className="h-10 w-28 bg-gray-200 rounded" />
          </div>

          {/* Tabs + search skeleton (simple) */}
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 flex items-center gap-3 flex-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 w-16 bg-gray-200 rounded" />
            ))}
            <div className="flex-1" />
            <div className="h-9 w-60 bg-gray-200 rounded" />
          </div>

          {/* Board grid skeleton simplified */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
              <div className="space-y-2">
                <div className="h-6 w-24 bg-gray-200 rounded" />
                <div className="h-6 w-20 bg-gray-200 rounded" />
              </div>
            </div>
            {[1, 2, 3].map((col) => (
              <div key={col} className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                {[1, 2].map((card) => (
                  <div
                    key={card}
                    className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2"
                    style={{ minHeight: 80 }}
                  >
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                ))}
                <div className="h-8 border border-dashed border-gray-300 rounded-md bg-white" />
              </div>
            ))}
          </div>
        </div>
      ) : !board ? (
        <div className="flex items-center justify-center py-20 text-gray-600 text-lg">
          Board not found or no permission.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{board.title}</h2>
                {board.description && (
                  <p className="text-gray-500 text-sm mt-1">{board.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  {boardMembers.slice(0, 5).map((member: any, index: number) => {
                    const user = member.user_id;
                    const userId = user?._id || user?.id;
                    const userName = user?.full_name || user?.username || 'User';
                    const avatarUrl = userId ? memberAvatars[userId] : '';

                    return (
                      <div
                        key={member._id || member.id || index}
                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white font-semibold text-xs shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        title={userName}
                        style={{
                          backgroundColor: avatarUrl ? 'transparent' : getAvatarColor(userName),
                        }}
                        onClick={() => navigate(`/project/${id}/members`)}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={userName}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                e.currentTarget.remove();
                                parent.textContent = userName.charAt(0).toUpperCase();
                                parent.style.backgroundColor = getAvatarColor(userName);
                              }
                            }}
                          />
                        ) : (
                          userName.charAt(0).toUpperCase()
                        )}
                      </div>
                    );
                  })}
                  {boardMembers.length > 5 && (
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center bg-gray-400 text-white font-semibold text-xs shadow-sm cursor-pointer hover:bg-gray-500 transition-colors"
                      onClick={() => navigate(`/project/${id}/members`)}
                      title="View all members"
                    >
                      +{boardMembers.length - 5}
                    </div>
                  )}
                </div>
                <button
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
                  onClick={() => setShowAddMemberModal(true)}
                >
                  + Add member
                </button>
                <button
                  onClick={handleDeleteBoard}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                  title="Delete Board"
                  aria-label="Delete Board"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    if (onBack) {
                      onBack();
                    } else {
                      const rolesRaw = localStorage.getItem('roles');
                      let roles: string[] = [];
                      try {
                        roles = rolesRaw ? JSON.parse(rolesRaw) : [];
                      } catch {
                        roles = [];
                      }
                      const allowedAdminRoles = ['admin', 'System_Manager'];
                      const isAdmin = roles.some((role) => allowedAdminRoles.includes(role));
                      navigate(isAdmin ? '/admin/projects' : '/dashboard/projects');
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <img src="/icons/back.png" alt="Back" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs + Toolbar in one row */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
            {/* Left: Tabs (scrollable when too many tabs) */}
            <div className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0">
              {['Summary', 'Board', 'Chart'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 rounded-md font-medium text-sm transition-all whitespace-nowrap ${activeTab === tab
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/70'
                    }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Right: Search + Icons (fixed area so controls remain visible) */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Tìm kiếm thường - tách riêng */}
              <div className="relative flex-shrink-0">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10"
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
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 md:w-64 text-sm min-w-[120px]"
                />
              </div>

              {/* Tìm kiếm NLP - tách riêng */}
              <div className="relative flex-shrink-0 hidden lg:block">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 z-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                {isSearchingNLP && (
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500 animate-spin z-10"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                <input
                  type="text"
                  placeholder="AI Search - Press Enter"
                  value={nlpSearchQuery}
                  onChange={(e) => setNlpSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNLPSearch();
                    }
                  }}
                  className="pl-10 pr-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-purple-50/50 w-48 xl:w-64 text-sm min-w-[140px]"
                />
              </div>
              <div className="flex items-center gap-2 relative flex-shrink-0">
                <button
                  onClick={() => navigate(`/project/${id}/history`)}
                  title="Activity Logs"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m4-3a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>

                {/* Filter Dropdown Toggle */}
                <button
                  onClick={() => setShowFilterDropdown((s) => !s)}
                  title="Filter"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-1.447.894L9 17l-4.558 2.894A1 1 0 013 19V4z"
                    />
                  </svg>
                </button>

                {/* Filter Dropdown */}
                <FilterDropdown
                  show={showFilterDropdown}
                  allTags={allTags}
                  selectedFilterTagIds={selectedFilterTagIds}
                  searchQuery={filterTagSearch}
                  onSearchChange={setFilterTagSearch}
                  onToggleTag={(tagId) => {
                    if (selectedFilterTagIds.includes(tagId)) {
                      setSelectedFilterTagIds((prev) => prev.filter((id) => id !== tagId));
                    } else {
                      setSelectedFilterTagIds((prev) => [...prev, tagId]);
                    }
                  }}
                  onClearAll={() => setSelectedFilterTagIds([])}
                />

                <button
                  onClick={() => setShowTagManager(true)}
                  title="Manage Tags"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    const rolesRaw = localStorage.getItem('roles');
                    let roles: string[] = [];
                    try {
                      roles = rolesRaw ? JSON.parse(rolesRaw) : [];
                    } catch {
                      roles = [];
                    }
                    const allowedAdminRoles = ['admin', 'System_Manager'];
                    const isAdmin = roles.some((role) => allowedAdminRoles.includes(role));
                    navigate(
                      isAdmin ? `/admin/boards/${id}/settings` : `/dashboard/boards/${id}/settings`,
                    );
                  }}
                  title="Board Settings"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* If Summary tab active, render BoardSummary */}
          {activeTab === 'Summary' ? (
            <BoardSummary
              board={board}
              tasks={tasks}
              columns={columns}
              swimlanes={swimlanes}
              members={boardMembers}
            />
          ) : activeTab === 'Chart' ? (
            <TaskCharts boardId={id} />
          ) : (
            <>
              {columnList.length === 0 && (
                <div className="flex items-center justify-center py-16 text-gray-500">
                  <div className="text-center">
                    <p className="text-lg mb-2">No columns found</p>
                    <p className="text-sm">Please add columns to this board in settings.</p>
                  </div>
                </div>
              )}

              {columnList.length > 0 &&
                (effectiveSwimlaneList.length > 0
                  ? renderBoardContent(effectiveSwimlaneList)
                  : renderSimpleBoardContent())}
            </>
          )}

          <CreateTaskModal
            show={showNewTask}
            newTask={newTask}
            allTags={allTags}
            newTaskTagSearch={newTaskTagSearch}
            newTaskSelectedTagId={newTaskSelectedTagId}
            onClose={() => setShowNewTask(false)}
            onTaskChange={setNewTask}
            onTagSearchChange={(search) => {
              setNewTaskTagSearch(search);
              setNewTaskSelectedTagId('');
            }}
            onTagSelect={(tagId, tagName) => {
              setNewTaskSelectedTagId(tagId);
              setNewTaskTagSearch(tagName);
            }}
            onCreate={handleCreateTask}
          />

          <EditTaskModal
            show={showEditTask}
            editingTask={editingTask}
            board={board}
            columns={columns}
            swimlanes={swimlanes}
            allTags={allTags}
            taskTags={taskTags}
            tagSearchInput={tagSearchInput}
            selectedTagId={selectedTagId}
            boardMembers={boardMembers}
            isLoading={isEditingTaskLoading}
            onClose={closeEditTaskModal}
            onTaskChange={setEditingTask}
            onTagSearchChange={(search) => {
              setTagSearchInput(search);
              setSelectedTagId('');
            }}
            onTagSelect={(tagId, tagName) => {
              setSelectedTagId(tagId);
              setTagSearchInput(tagName);
            }}
            onRemoveTag={handleRemoveTag}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
          />

          <TagManagerModal
            show={showTagManager}
            allTags={allTags}
            editingTag={editingTag}
            newTagName={newTagName}
            newTagColor={newTagColor}
            onClose={() => {
              setShowTagManager(false);
              setEditingTag(null);
            }}
            onNewTagNameChange={setNewTagName}
            onNewTagColorChange={setNewTagColor}
            onCreateTag={handleCreateTag}
            onEditTag={setEditingTag}
            onUpdateTag={handleUpdateTag}
            onCancelEdit={() => setEditingTag(null)}
            onDeleteTag={handleDeleteTag}
            onEditingTagChange={setEditingTag}
          />

          {/* Task History Modal */}
          {showHistoryModal && (
            <div
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
              onClick={() => setShowHistoryModal(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Task Change History</h3>
                    {editingTask && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{editingTask.title}</p>
                    )}
                  </div>
                  <button
                    className="text-gray-500 hover:text-gray-800"
                    onClick={() => setShowHistoryModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {loadingHistory ? (
                    <div className="py-10 text-center text-gray-500 text-sm">
                      Loading history...
                    </div>
                  ) : historyItems.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 text-sm">
                      No change history for this task.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {historyItems.map((item) => (
                        <li
                          key={item._id}
                          className="border border-gray-200 rounded-md p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-medium text-gray-900">
                              {item.changed_by?.username ||
                                item.changed_by?.email ||
                                'Unknown user'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-line break-words">
                            {item.change_type}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {showAddMemberModal && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
              onClick={() => setShowAddMemberModal(false)}
            >
              <div
                className="bg-white shadow-xl w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-6 py-4 bg-indigo-600">
                  <h2 className="text-lg font-semibold text-white">Add member</h2>
                  <button
                    className="text-white hover:text-gray-200"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search users
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-gray-200">
                    {filteredAvailableUsers.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-500">
                        No matching users
                      </div>
                    ) : (
                      filteredAvailableUsers.map((u: any) => (
                        <div
                          key={u._id}
                          className={`flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedUserId === u._id ? 'bg-indigo-50' : ''
                            }`}
                          onClick={() => setSelectedUserId(u._id)}
                        >
                          <div className="w-10 h-10 overflow-hidden bg-gray-300 flex items-center justify-center text-white">
                            {(u.full_name || u.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {u.full_name || u.username}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{u.email}</div>
                          </div>
                          {selectedUserId === u._id && (
                            <div className="text-indigo-600 font-bold">✓</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Thành viên">Thành viên</option>
                      <option value="Người tạo">Người tạo</option>
                      <option value="Người Xem">Người Xem</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
                  <button
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                    onClick={() => setShowAddMemberModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={!selectedUserId}
                    onClick={handleAddMemberToBoard}
                  >
                    Add member
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BoardDetail;
