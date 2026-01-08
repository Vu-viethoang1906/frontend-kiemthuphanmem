import { fetchAllApiKey, createApiKey, deleteApiKey, updateApiKey, ApiKey } from '../../../api/apiKey';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('apiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllApiKey', () => {
    it('should fetch all API keys', async () => {
      const mockApiKeys: ApiKey[] = [
        {
          _id: 'key-1',
          key: 'abc123',
          description: 'Test key 1',
          revoked: false,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
        {
          _id: 'key-2',
          key: 'xyz789',
          description: 'Test key 2',
          revoked: false,
          createdAt: '2024-01-02',
          updatedAt: '2024-01-02',
        },
      ];
      mockAxios.get.mockResolvedValue({ data: { data: mockApiKeys, success: true } });

      const result = await fetchAllApiKey();

      expect(mockAxios.get).toHaveBeenCalledWith('/apiKey/');
      expect(result.data).toEqual(mockApiKeys);
      expect(result.success).toBe(true);
    });

    it('should handle empty API keys list', async () => {
      mockAxios.get.mockResolvedValue({ data: { data: [], success: true } });

      const result = await fetchAllApiKey();

      expect(result.data).toEqual([]);
    });
  });

  describe('createApiKey', () => {
    it('should create new API key', async () => {
      const newKeyData = {
        description: 'New API Key',
        key: 'new-key-123',
      };
      const mockResponse: ApiKey = {
        _id: 'key-3',
        ...newKeyData,
        revoked: false,
        createdAt: '2024-01-03',
        updatedAt: '2024-01-03',
      };
      mockAxios.post.mockResolvedValue({ data: { data: [mockResponse], success: true } });

      const result = await createApiKey(newKeyData);

      expect(mockAxios.post).toHaveBeenCalledWith('/apiKey/', newKeyData);
      expect(result.data[0]).toEqual(mockResponse);
    });

    it('should handle creation errors', async () => {
      mockAxios.post.mockRejectedValue(new Error('Key already exists'));

      await expect(
        createApiKey({ description: 'Test', key: 'duplicate' })
      ).rejects.toThrow('Key already exists');
    });
  });

  describe('deleteApiKey', () => {
    it('should delete API key by id', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } });

      await deleteApiKey('key-456');

      expect(mockAxios.delete).toHaveBeenCalledWith('/apiKey/key-456');
    });

    it('should handle deletion errors', async () => {
      mockAxios.delete.mockRejectedValue(new Error('Key not found'));

      await expect(deleteApiKey('invalid-key')).rejects.toThrow('Key not found');
    });
  });

  describe('updateApiKey', () => {
    it('should update API key description', async () => {
      const updateData = { description: 'Updated description' };
      const mockUpdated: ApiKey = {
        _id: 'key-1',
        key: 'abc123',
        description: 'Updated description',
        revoked: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-04',
      };
      mockAxios.put.mockResolvedValue({ data: mockUpdated });

      const result = await updateApiKey('key-1', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/apiKey/key-1', updateData);
      expect(result).toEqual(mockUpdated);
    });

    it('should revoke API key', async () => {
      const revokeData = { revoked: true };
      const mockRevoked: ApiKey = {
        _id: 'key-2',
        key: 'xyz789',
        description: 'Test key',
        revoked: true,
        createdAt: '2024-01-02',
        updatedAt: '2024-01-04',
      };
      mockAxios.put.mockResolvedValue({ data: mockRevoked });

      const result = await updateApiKey('key-2', revokeData);

      expect(mockAxios.put).toHaveBeenCalledWith('/apiKey/key-2', revokeData);
      expect(result.revoked).toBe(true);
    });

    it('should update both description and revoked status', async () => {
      const updateData = { description: 'New desc', revoked: true };
      mockAxios.put.mockResolvedValue({
        data: {
          _id: 'key-3',
          key: 'test',
          ...updateData,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-04',
        },
      });

      await updateApiKey('key-3', updateData);

      expect(mockAxios.put).toHaveBeenCalledWith('/apiKey/key-3', updateData);
    });
  });
});
