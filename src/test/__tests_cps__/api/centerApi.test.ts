import {
  getAllCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
} from '../../../api/centerApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('centerApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCenters', () => {
    it('should fetch all centers', async () => {
      const mockCenters = [
        { _id: 'center-1', name: 'Center A', status: 'active' },
        { _id: 'center-2', name: 'Center B', status: 'active' },
      ];
      mockAxios.get.mockResolvedValue({ data: mockCenters });

      const result = await getAllCenters();

      expect(mockAxios.get).toHaveBeenCalledWith('/centers');
      expect(result).toEqual(mockCenters);
    });

    it('should handle empty centers list', async () => {
      mockAxios.get.mockResolvedValue({ data: [] });

      const result = await getAllCenters();

      expect(result).toEqual([]);
    });
  });

  describe('getCenterById', () => {
    it('should fetch center by ID', async () => {
      const mockCenter = {
        _id: 'center-123',
        name: 'Test Center',
        status: 'active',
        email: 'test@center.com',
      };
      mockAxios.get.mockResolvedValue({ data: mockCenter });

      const result = await getCenterById('center-123');

      expect(mockAxios.get).toHaveBeenCalledWith('/centers/center-123');
      expect(result).toEqual(mockCenter);
    });
  });

  describe('createCenter', () => {
    it('should create new center', async () => {
      const newCenter = {
        name: 'New Center',
        address: '123 Main St',
        status: 'active' as const,
        email: 'new@center.com',
      };
      const mockResponse = { _id: 'center-new', ...newCenter };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await createCenter(newCenter);

      expect(mockAxios.post).toHaveBeenCalledWith('/centers', newCenter);
      expect(result).toEqual(mockResponse);
    });

    it('should create center with minimal data', async () => {
      const minimalData = { name: 'Minimal Center' };
      mockAxios.post.mockResolvedValue({ data: { _id: 'min-center', ...minimalData } });

      await createCenter(minimalData);

      expect(mockAxios.post).toHaveBeenCalledWith('/centers', minimalData);
    });
  });

  describe('updateCenter', () => {
    it('should update center with new data', async () => {
      const updateData = {
        name: 'Updated Center',
        status: 'maintenance' as const,
      };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateCenter('center-456', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/centers/center-456', updateData);
    });

    it('should update only specified fields', async () => {
      const partialUpdate = { phone: '555-1234' };
      mockAxios.put.mockResolvedValue({ data: { success: true } });

      await updateCenter('center-789', partialUpdate);

      expect(mockAxios.put).toHaveBeenCalledWith('/centers/center-789', partialUpdate);
    });
  });

  describe('deleteCenter', () => {
    it('should soft delete center', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true, message: 'Center deleted' } });

      const result = await deleteCenter('center-delete');

      expect(mockAxios.delete).toHaveBeenCalledWith('/centers/center-delete');
      expect(result.success).toBe(true);
    });

    it('should handle deletion errors', async () => {
      mockAxios.delete.mockRejectedValue(new Error('Center not found'));

      await expect(deleteCenter('invalid-center')).rejects.toThrow('Center not found');
    });
  });
});
