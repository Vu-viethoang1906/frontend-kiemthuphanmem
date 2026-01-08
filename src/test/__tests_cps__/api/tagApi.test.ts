import axiosInstance from '../../../api/axiosInstance';
import {
  fetchAllTags,
  fetchTagById,
  createTag,
  updateTag,
  deleteTag,
  fetchTagsByTask,
  addTagToTask,
  removeTagFromTask,
  fetchTagsByBoard,
} from '../../../api/tagApi';

jest.mock('../../../api/axiosInstance');

describe('tagApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllTags', () => {
    it('should fetch all tags', async () => {
      const mockResponse = { data: [{ id: 'tag1', name: 'Tag 1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchAllTags();

      expect(mockAxios.get).toHaveBeenCalledWith('/tags');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchTagById', () => {
    it('should fetch tag by ID', async () => {
      const id = 'tag1';
      const mockResponse = { data: { id, name: 'Tag 1' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchTagById(id);

      expect(mockAxios.get).toHaveBeenCalledWith(`/tags/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createTag', () => {
    it('should create a tag', async () => {
      const data = { name: 'New Tag', color: '#FF0000', description: 'Description', boardId: 'board1' };
      const mockResponse = { data: { id: 'tag1', ...data } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createTag(data);

      expect(mockAxios.post).toHaveBeenCalledWith('/tags', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateTag', () => {
    it('should update a tag', async () => {
      const id = 'tag1';
      const data = { name: 'Updated Tag', color: '#00FF00' };
      const mockResponse = { data: { id, ...data } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateTag(id, data);

      expect(mockAxios.put).toHaveBeenCalledWith(`/tags/${id}`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteTag', () => {
    it('should delete a tag', async () => {
      const id = 'tag1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteTag(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/tags/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchTagsByTask', () => {
    it('should fetch tags by task ID', async () => {
      const taskId = 'task1';
      const mockResponse = { data: [{ id: 'tag1', name: 'Tag 1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchTagsByTask(taskId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/tags/task/${taskId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('addTagToTask', () => {
    it('should add tag to task', async () => {
      const taskId = 'task1';
      const tagId = 'tag1';
      const mockResponse = { data: { success: true } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await addTagToTask(taskId, tagId);

      expect(mockAxios.post).toHaveBeenCalledWith(`/tags/task/${taskId}/tag/${tagId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('removeTagFromTask', () => {
    it('should remove tag from task', async () => {
      const taskId = 'task1';
      const tagId = 'tag1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await removeTagFromTask(taskId, tagId);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/tags/task/${taskId}/tag/${tagId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchTagsByBoard', () => {
    it('should fetch tags by board ID', async () => {
      const boardId = 'board1';
      const mockResponse = { data: { data: [{ id: 'tag1', name: 'Tag 1' }] } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchTagsByBoard(boardId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/tags/board/${boardId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

