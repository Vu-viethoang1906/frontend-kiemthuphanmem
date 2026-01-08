import axiosInstance from '../../../api/axiosInstance';
import {
  createComment,
  fetchCommentsByTask,
  fetchCommentById,
  updateComment,
  deleteComment,
  fetchMyComments,
} from '../../../api/commentApi';

jest.mock('../../../api/axiosInstance');

describe('commentApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create a comment', async () => {
      const data = { task_id: 'task1', content: 'Test comment', user_id: 'user1' };
      const mockResponse = { data: { id: 'comment1', ...data } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createComment(data);

      expect(mockAxios.post).toHaveBeenCalledWith('/comments', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchCommentsByTask', () => {
    it('should fetch comments by task ID', async () => {
      const taskId = 'task1';
      const mockResponse = { data: [{ id: 'comment1', content: 'Comment 1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchCommentsByTask(taskId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/comments/task/${taskId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchCommentById', () => {
    it('should fetch comment by ID', async () => {
      const id = 'comment1';
      const mockResponse = { data: { id, content: 'Test comment' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchCommentById(id);

      expect(mockAxios.get).toHaveBeenCalledWith(`/comments/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateComment', () => {
    it('should update a comment', async () => {
      const id = 'comment1';
      const data = { content: 'Updated comment' };
      const mockResponse = { data: { id, ...data } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateComment(id, data);

      expect(mockAxios.put).toHaveBeenCalledWith(`/comments/${id}`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      const id = 'comment1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteComment(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/comments/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchMyComments', () => {
    it('should fetch my comments', async () => {
      const mockResponse = { data: [{ id: 'comment1', content: 'My comment' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchMyComments();

      expect(mockAxios.get).toHaveBeenCalledWith('/comments/user/my');
      expect(result).toEqual(mockResponse.data);
    });
  });
});

