import axiosInstance from '../../../api/axiosInstance';
import {
  fetchSwimlanesByBoard,
  fetchSwimlaneById,
  createSwimlane,
  updateSwimlane,
  deleteSwimlane,
  toggleCollapseSwimlane,
  reorderSwimlanes,
} from '../../../api/swimlaneApi';

jest.mock('../../../api/axiosInstance');

describe('swimlaneApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSwimlanesByBoard', () => {
    it('should fetch swimlanes by board ID', async () => {
      const boardId = 'board1';
      const mockResponse = { data: [{ id: 'swimlane1', name: 'Swimlane 1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchSwimlanesByBoard(boardId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/swimlanes/board/${boardId}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('fetchSwimlaneById', () => {
    it('should fetch swimlane by ID', async () => {
      const id = 'swimlane1';
      const mockResponse = { data: { id, name: 'Swimlane 1' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await fetchSwimlaneById(id);

      expect(mockAxios.get).toHaveBeenCalledWith(`/swimlanes/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('createSwimlane', () => {
    it('should create a swimlane', async () => {
      const data = { board_id: 'board1', name: 'New Swimlane', order: 1 };
      const mockResponse = { data: { id: 'swimlane1', ...data } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createSwimlane(data);

      expect(mockAxios.post).toHaveBeenCalledWith('/swimlanes', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateSwimlane', () => {
    it('should update a swimlane', async () => {
      const id = 'swimlane1';
      const data = { name: 'Updated Swimlane', order: 2 };
      const mockResponse = { data: { id, ...data } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateSwimlane(id, data);

      expect(mockAxios.put).toHaveBeenCalledWith(`/swimlanes/${id}`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteSwimlane', () => {
    it('should delete a swimlane', async () => {
      const id = 'swimlane1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteSwimlane(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/swimlanes/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('toggleCollapseSwimlane', () => {
    it('should toggle collapse swimlane', async () => {
      const id = 'swimlane1';
      const mockResponse = { data: { id, collapsed: true } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await toggleCollapseSwimlane(id);

      expect(mockAxios.put).toHaveBeenCalledWith(`/swimlanes/${id}/toggle-collapse`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('reorderSwimlanes', () => {
    it('should reorder swimlanes', async () => {
      const boardId = 'board1';
      const data = { swimlane_ids: ['swimlane1', 'swimlane2'] };
      const mockResponse = { data: { success: true } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await reorderSwimlanes(boardId, data);

      expect(mockAxios.put).toHaveBeenCalledWith(`/swimlanes/board/${boardId}/reorder`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

