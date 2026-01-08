import { searchTasksByNLP } from '../../../api/nlpApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const sampleResponse = {
  status: 'ok',
  tasks: [
    {
      _id: 't1',
      title: 'Fix bug',
      column_id: 'c1',
      assigned_to: { username: 'alice' },
      priority: 'high',
    },
  ],
};

describe('nlpApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts query without board id when not provided', async () => {
    mockAxios.post.mockResolvedValue({ data: sampleResponse });

    const result = await searchTasksByNLP('tasks due soon');

    expect(mockAxios.post).toHaveBeenCalledWith('/nlp/parse', { query: 'tasks due soon', board_id: undefined });
    expect(result).toEqual(sampleResponse);
  });

  it('posts query with board id when provided', async () => {
    mockAxios.post.mockResolvedValue({ data: sampleResponse });

    await searchTasksByNLP('tasks của tôi', 'board-123');

    expect(mockAxios.post).toHaveBeenCalledWith('/nlp/parse', { query: 'tasks của tôi', board_id: 'board-123' });
  });
});
