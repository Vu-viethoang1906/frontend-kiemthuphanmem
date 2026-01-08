import { getTaskQualityMetrics } from '../../../api/taskQualityApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const sampleMetrics = {
  board: {
    id: 'b1',
    title: 'Board 1',
  },
  summary: {
    totalTasks: 3,
    averageCommentsPerTask: 2,
    averageAttachmentsPerTask: 1,
    averageChurnCount: 0.5,
    averageCollaborationScore: 8,
    lowQualityTasksCount: 1,
    highChurnTasksCount: 1,
  },
  lowQualityTasks: [
    {
      task_id: 't1',
      title: 'Task 1',
      column_name: 'Todo',
      assigned_to: { id: 'u1', username: 'user1' },
      commentCount: 1,
      attachmentCount: 0,
      collaborationScore: 3,
      warning: 'Low collaboration',
    },
  ],
  highChurnTasks: [
    {
      task_id: 't2',
      title: 'Task 2',
      column_name: 'In Progress',
      assigned_to: { id: 'u2', username: 'user2' },
      churnCount: 5,
      commentCount: 4,
      collaborationScore: 6,
      warning: 'High churn',
    },
  ],
  tasks: [
    {
      task_id: 't3',
      title: 'Task 3',
      column_name: 'Done',
      assigned_to: null,
      commentCount: 2,
      attachmentCount: 1,
      churnCount: 1,
      collaborationScore: 9,
    },
  ],
};

describe('taskQualityApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets task quality metrics by board id and unwraps data', async () => {
    mockAxios.get.mockResolvedValue({ data: { success: true, data: sampleMetrics } });

    const result = await getTaskQualityMetrics('b1');

    expect(mockAxios.get).toHaveBeenCalledWith('/analytics/task-quality-metrics', {
      params: { board_id: 'b1' },
    });
    expect(result).toEqual(sampleMetrics);
  });
});
