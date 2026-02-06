import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyStarredTasks, toggleTaskStar } from '../../api/taskApi';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  description?: string;
  board_id?: {
    _id: string;
    title: string;
  };
  column_id?: {
    _id: string;
    name: string;
  };
  assigned_to?: {
    _id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  created_by?: {
    _id: string;
    username: string;
    full_name?: string;
  };
  due_date?: string;
  priority?: string;
  tags?: any[];
  starred_by?: string[];
}

const MyStarredTasks: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [starringId, setStarringId] = useState<string | null>(null);

  useEffect(() => {
    loadStarredTasks();
  }, []);

  const loadStarredTasks = async () => {
    try {
      setLoading(true);
      const response = await fetchMyStarredTasks();
      const tasksData = response?.data || response || [];
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error: any) {
      console.error('Error loading starred tasks:', error);
      toast.error('Không thể tải danh sách task đã đánh dấu');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStar = async (taskId: string) => {
    if (starringId === taskId) return;
    setStarringId(taskId);
    try {
      await toggleTaskStar(taskId);
      toast.success('Đã bỏ đánh dấu task');
      await loadStarredTasks();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Không thể bỏ đánh dấu';
      toast.error(msg);
    } finally {
      setStarringId(null);
    }
  };

  const handleTaskClick = (task: Task) => {
    const boardId = task.board_id?._id || task.board_id;
    if (boardId) {
      const basePath = window.location.pathname.includes('/admin') ? '/admin' : '/dashboard';
      navigate(`${basePath}/project/${boardId}?task=${task._id}`);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      task.title.toLowerCase().includes(term) ||
      task.description?.toLowerCase().includes(term) ||
      task.board_id?.title?.toLowerCase().includes(term) ||
      task.column_id?.name?.toLowerCase().includes(term)
    );
  });

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-yellow-500"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Task Quan Trọng Của Tôi
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Danh sách các task bạn đã đánh dấu là quan trọng
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
          >
            Quay lại
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm task..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Không tìm thấy task nào' : 'Chưa có task nào được đánh dấu'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Hãy đánh dấu các task quan trọng để theo dõi dễ dàng hơn'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex-1 line-clamp-2">
                    {task.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStar(task._id);
                    }}
                    disabled={starringId === task._id}
                    className={`ml-2 flex-shrink-0 ${
                      starringId === task._id ? 'opacity-50 cursor-wait' : ''
                    }`}
                    title="Bỏ đánh dấu"
                  >
                    <svg
                      className="w-5 h-5 text-yellow-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                )}

                <div className="space-y-2">
                  {task.board_id && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span className="truncate">{task.board_id.title}</span>
                    </div>
                  )}

                  {task.column_id && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span>{task.column_id.name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    {task.due_date && (
                      <div
                        className={`text-xs font-medium ${
                          isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        📅 {formatDate(task.due_date)}
                      </div>
                    )}
                    {task.priority && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyStarredTasks;
