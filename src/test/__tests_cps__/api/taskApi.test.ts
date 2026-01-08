import {
  createTask,
  fetchTaskById,
  updateTask,
  deleteTask,
  fetchTasksByBoard,
  searchTasksInBoard,
  fetchTaskStatsByBoard,
  fetchTaskHistory,
  fetchTasksByColumn,
  fetchMyAssignedTasks,
  fetchTasksByUser,
  updateTaskDates,
  updateTaskEstimate,
  moveTaskApi,
  moveColumnApi,
  moveSwimlaneApi,
  dataLineChart,
} from '../../../api/taskApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('taskApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create new task', async () => {
      const taskData = { title: 'New Task', columnId: 'col-1' };
      mockAxios.post.mockResolvedValue({ data: { _id: 'task-1', ...taskData } });

      const result = await createTask(taskData);

      expect(mockAxios.post).toHaveBeenCalledWith('/tasks', taskData);
      expect(result._id).toBe('task-1');
    });
  });

  describe('fetchTaskById', () => {
    it('should fetch task by ID', async () => {
      const mockTask = { _id: 'task-123', title: 'Test Task' };
      mockAxios.get.mockResolvedValue({ data: mockTask });

      const result = await fetchTaskById('task-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/task-123');
      expect(result).toEqual(mockTask);
    });
  });

  describe('updateTask', () => {
    it('should update task', async () => {
      const updateData = { title: 'Updated Task' };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateTask('task-456', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/tasks/task-456', updateData);
    });
  });

  describe('deleteTask', () => {
    it('should delete task', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await deleteTask('task-789');

      expect(mockAxios.delete).toHaveBeenCalledWith('/tasks/task-789');
    });
  });

  describe('fetchTasksByBoard', () => {
    it('should fetch tasks with default pagination', async () => {
      const mockTasks = [{ _id: 'task-1' }, { _id: 'task-2' }];
      mockAxios.get.mockResolvedValue({ data: mockTasks });

      await fetchTasksByBoard('board-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/board/board-123', {
        params: { limit: 1000, page: 1 },
      });
    });

    it('should fetch tasks with custom pagination', async () => {
      mockAxios.get.mockResolvedValue({ data: [] });

      await fetchTasksByBoard('board-456', { limit: 50, page: 2 });

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/board/board-456', {
        params: { limit: 50, page: 2 },
      });
    });
  });

  describe('searchTasksInBoard', () => {
    it('should search tasks in board', async () => {
      mockAxios.get.mockResolvedValue({ data: [{ _id: 'found-task' }] });

      await searchTasksInBoard('board-789', 'urgent');

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/board/board-789/search', {
        params: { query: 'urgent' },
      });
    });
  });

  describe('fetchTaskStatsByBoard', () => {
    it('should fetch task statistics', async () => {
      const mockStats = { total: 50, completed: 30, inProgress: 15 };
      mockAxios.get.mockResolvedValue({ data: mockStats });

      const result = await fetchTaskStatsByBoard('board-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/board/board-123/stats');
      expect(result).toEqual(mockStats);
    });
  });

  describe('fetchTaskHistory', () => {
    it('should fetch task history', async () => {
      const mockHistory = [{ action: 'created' }, { action: 'updated' }];
      mockAxios.get.mockResolvedValue({ data: mockHistory });

      await fetchTaskHistory('task-456');

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/task-456/history');
    });
  });

  describe('fetchTasksByColumn', () => {
    it('should fetch tasks by column', async () => {
      mockAxios.get.mockResolvedValue({ data: [{ _id: 'task-1' }] });

      await fetchTasksByColumn('column-789');

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/column/column-789');
    });
  });

  describe('fetchMyAssignedTasks', () => {
    it('should fetch my assigned tasks', async () => {
      const mockTasks = [{ _id: 'my-task-1' }, { _id: 'my-task-2' }];
      mockAxios.get.mockResolvedValue({ data: mockTasks });

      const result = await fetchMyAssignedTasks();

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/my/assigned');
      expect(result).toEqual(mockTasks);
    });
  });

  describe('fetchTasksByUser', () => {
    it('should fetch tasks by user ID', async () => {
      mockAxios.get.mockResolvedValue({ data: [{ _id: 'user-task' }] });

      await fetchTasksByUser('user-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/tasks/user/user-123');
    });
  });

  describe('updateTaskDates', () => {
    it('should update task dates', async () => {
      const dateData = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        due_date: '2024-01-15',
      };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateTaskDates('task-123', dateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/tasks/task-123/dates', dateData);
    });
  });

  describe('updateTaskEstimate', () => {
    it('should update task estimate', async () => {
      const estimateData = { estimated_hours: 8, estimated_points: 5 };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateTaskEstimate('task-456', estimateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/tasks/task-456/estimate', estimateData);
    });
  });

  describe('moveTaskApi', () => {
    it('should move task to new column', async () => {
      const moveData = {
        new_column_id: 'col-2',
        new_swimlane_id: 'swim-1',
        prev_task_id: 'task-prev',
        next_task_id: null,
      };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await moveTaskApi('task-789', moveData);

      expect(mockAxios.put).toHaveBeenCalledWith('/tasks/task-789/move', moveData);
    });
  });

  describe('moveColumnApi', () => {
    it('should reorder columns', async () => {
      const columnIds = ['col-1', 'col-3', 'col-2'];
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await moveColumnApi('board-123', columnIds);

      expect(mockAxios.put).toHaveBeenCalledWith('/column/board-123/move', {
        ids: columnIds,
      });
    });
  });

  describe('moveSwimlaneApi', () => {
    it('should reorder swimlanes', async () => {
      const swimlaneIds = ['swim-2', 'swim-1', 'swim-3'];
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await moveSwimlaneApi('board-456', swimlaneIds);

      expect(mockAxios.put).toHaveBeenCalledWith('/swimlanes/board/board-456/reorder', {
        ids: swimlaneIds,
      });
    });
  });

  describe('dataLineChart', () => {
    it('should fetch line chart data for board', async () => {
      const mockChartData = { labels: [], datasets: [] };
      mockAxios.post.mockResolvedValue({ data: mockChartData });

      const result = await dataLineChart('board-789');

      expect(mockAxios.post).toHaveBeenCalledWith('/tasks/board/board-789/lineChart');
      expect(result.data).toEqual(mockChartData);
    });
  });
});
