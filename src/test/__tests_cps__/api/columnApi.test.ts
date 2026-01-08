import axiosInstance from '../../../api/axiosInstance';
import {
  fetchColumnsByBoard,
  fetchColumnById,
  createColumn,
  updateColumn,
  deleteColumn,
} from '../../../api/columnApi';

jest.mock('../../../api/axiosInstance');

describe('columnApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchColumnsByBoard', () => {
    it('should fetch columns by board ID', async () => {
      const boardId = 'board1';
      const mockResponse = { data: [{ id: 'column1', name: 'Column 1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchColumnsByBoard(boardId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/column/board/${boardId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchColumnById', () => {
    it('should fetch column by ID', async () => {
      const id = 'column1';
      const mockResponse = { data: { id, name: 'Column 1' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchColumnById(id);

      expect(mockAxios.get).toHaveBeenCalledWith(`/column/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createColumn', () => {
    it('should create a column', async () => {
      const data = { board_id: 'board1', name: 'New Column', wip_limit: 5, order: 1, isdone: false };
      const mockResponse = { data: { _id: 'column1', ...data } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createColumn(data);

      expect(mockAxios.post).toHaveBeenCalledWith('/column', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateColumn', () => {
    it('should update a column', async () => {
      const id = 'column1';
      const data = { name: 'Updated Column', wip_limit: 10, order: 2 };
      const mockResponse = { data: { id, ...data } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateColumn(id, data);

      expect(mockAxios.put).toHaveBeenCalledWith(`/column/${id}`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteColumn', () => {
    it('should delete a column', async () => {
      const id = 'column1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteColumn(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/column/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

