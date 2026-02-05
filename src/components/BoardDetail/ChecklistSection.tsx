import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

interface ChecklistItem {
  _id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_by?: {
    _id: string;
    name: string;
    full_name?: string;
  };
}

interface ChecklistSectionProps {
  taskId?: string | null;
  onChecklistUpdate?: (progress: { completed: number; total: number }) => void;
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  taskId,
  onChecklistUpdate,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });

  // Fetch checklist items
  useEffect(() => {
    if (!taskId) return;

    const fetchChecklists = async () => {
      setIsLoading(true);
      try {
        const response = await axiosInstance.get(`/checklists/task/${taskId}`);
        if (response.data.success) {
          setItems(response.data.data.items);
          setProgress(response.data.data.progress);
          onChecklistUpdate?.({
            completed: response.data.data.progress.completed,
            total: response.data.data.progress.total,
          });
        }
      } catch (error: any) {
        console.error('Error fetching checklists:', error);
        console.error('Error details:', {
          message: error?.message,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          url: error?.config?.url,
        });
        // Don't show error toast here since checklist is optional
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChecklists();
  }, [taskId, onChecklistUpdate]);

  // Add new checklist item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || newItemTitle.trim() === '') return;

    setIsAdding(true);
    try {
      const response = await axiosInstance.post(`/checklists/task/${taskId}`, {
        title: newItemTitle.trim(),
      });

      if (response.data.success) {
        setItems([...items, response.data.data]);
        setNewItemTitle('');
        toast.success('Thêm mục kiểm tra thành công');

        // Update progress
        const newCompleted = items.filter(i => i.is_completed).length;
        const newTotal = items.length + 1;
        const newPercentage = Math.round((newCompleted / newTotal) * 100);
        setProgress({ completed: newCompleted, total: newTotal, percentage: newPercentage });
        onChecklistUpdate?.({ completed: newCompleted, total: newTotal });
      }
    } catch (error: any) {
      console.error('Error adding checklist item:', error);
      toast.error(error?.response?.data?.message || 'Không thể thêm mục kiểm tra');
    } finally {
      setIsAdding(false);
    }
  };

  // Toggle checklist item completion
  const handleToggle = async (itemId: string) => {
    try {
      const response = await axiosInstance.patch(
        `/checklists/${itemId}/toggle`
      );

      if (response.data.success) {
        setItems(
          items.map(item =>
            item._id === itemId
              ? { ...item, is_completed: response.data.data.is_completed }
              : item
          )
        );

        const updatedCompleted = items.map(item =>
          item._id === itemId
            ? { ...item, is_completed: response.data.data.is_completed }
            : item
        ).filter(i => i.is_completed).length;

        const newProgress = { 
          completed: updatedCompleted, 
          total: items.length,
          percentage: items.length > 0 ? Math.round((updatedCompleted / items.length) * 100) : 0
        };
        setProgress(newProgress);
        onChecklistUpdate?.({ completed: updatedCompleted, total: items.length });
      }
    } catch (error: any) {
      console.error('Error toggling checklist item:', error);
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  // Delete checklist item
  const handleDelete = async (itemId: string) => {
    try {
      const response = await axiosInstance.delete(`/checklists/${itemId}`);

      if (response.data.success) {
        const newItems = items.filter(item => item._id !== itemId);
        setItems(newItems);
        toast.success('Xóa mục kiểm tra thành công');

        const newCompleted = newItems.filter(i => i.is_completed).length;
        const newTotal = newItems.length;
        const newPercentage = newTotal > 0 ? Math.round((newCompleted / newTotal) * 100) : 0;
        setProgress({ completed: newCompleted, total: newTotal, percentage: newPercentage });
        onChecklistUpdate?.({ completed: newCompleted, total: newTotal });
      }
    } catch (error: any) {
      console.error('Error deleting checklist item:', error);
      toast.error('Không thể xóa mục kiểm tra');
    }
  };

  if (!taskId) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
        Hãy lưu task trước khi thêm danh sách kiểm tra
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {progress.total > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Tiến độ
            </span>
            <span className="text-sm font-bold text-indigo-600">
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.percentage}% hoàn thành
          </p>
        </div>
      )}

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={e => setNewItemTitle(e.target.value)}
            placeholder="Thêm mục kiểm tra mới..."
            disabled={isAdding}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isAdding || newItemTitle.trim() === ''}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Thêm mục kiểm tra"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Thêm</span>
          </button>
        </div>
      </form>

      {/* Checklist Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
          Chưa có mục kiểm tra. Thêm mục đầu tiên của bạn!
        </div>
      ) : (
        <div className="space-y-2 bg-white border border-gray-200 rounded-lg p-3">
          {items.map(item => (
            <div
              key={item._id}
              className="flex items-center gap-2 p-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => handleToggle(item._id)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  item.is_completed
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-gray-300 hover:border-indigo-500'
                }`}
                title={
                  item.is_completed
                    ? 'Đánh dấu chưa hoàn thành'
                    : 'Đánh dấu hoàn thành'
                }
              >
                {item.is_completed && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </button>

              {/* Title */}
              <span
                className={`flex-1 text-sm transition-all duration-200 ${
                  item.is_completed
                    ? 'line-through text-gray-400'
                    : 'text-gray-900'
                }`}
              >
                {item.title}
              </span>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDelete(item._id)}
                className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                title="Xóa mục kiểm tra"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      {items.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          {progress.completed === progress.total && progress.total > 0
            ? '✨ Tuyệt vời! Bạn đã hoàn thành tất cả các mục!'
            : `Hoàn thành ${progress.total - progress.completed} mục để xong task này`}
        </p>
      )}
    </div>
  );
};

export default ChecklistSection;
