import { getRoles, getUsers } from '../../../api/paginationApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('paginationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRoles', () => {
    it('should fetch roles with default pagination', async () => {
      const mockRoles = {
        data: [
          { id: '1', name: 'Admin' },
          { id: '2', name: 'User' },
        ],
        total: 10,
        page: 1,
        pageSize: 5,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockRoles });

      const result = await getRoles();

      expect(mockedAxios.get).toHaveBeenCalledWith('/roles?page=1&pageSize=5');
      expect(result).toEqual(mockRoles);
    });

    it('should fetch roles with custom pagination', async () => {
      const mockRoles = {
        data: [{ id: '3', name: 'Manager' }],
        total: 10,
        page: 2,
        pageSize: 10,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockRoles });

      const result = await getRoles(2, 10);

      expect(mockedAxios.get).toHaveBeenCalledWith('/roles?page=2&pageSize=10');
      expect(result).toEqual(mockRoles);
    });

    it('should handle empty roles list', async () => {
      const mockRoles = { data: [], total: 0, page: 1, pageSize: 5 };
      mockedAxios.get.mockResolvedValueOnce({ data: mockRoles });

      const result = await getRoles();

      expect(result).toEqual(mockRoles);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Failed to fetch roles');
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(getRoles()).rejects.toThrow('Failed to fetch roles');
    });
  });

  describe('getUsers', () => {
    it('should fetch users with default pagination', async () => {
      const mockUsers = {
        data: [
          { id: '1', username: 'john', email: 'john@example.com' },
          { id: '2', username: 'jane', email: 'jane@example.com' },
        ],
        total: 20,
        page: 1,
        pageSize: 5,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      const result = await getUsers();

      expect(mockedAxios.get).toHaveBeenCalledWith('/users?page=1&pageSize=5');
      expect(result).toEqual(mockUsers);
    });

    it('should fetch users with custom pagination', async () => {
      const mockUsers = {
        data: [{ id: '3', username: 'bob', email: 'bob@example.com' }],
        total: 20,
        page: 3,
        pageSize: 15,
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      const result = await getUsers(3, 15);

      expect(mockedAxios.get).toHaveBeenCalledWith('/users?page=3&pageSize=15');
      expect(result).toEqual(mockUsers);
    });

    it('should handle empty users list', async () => {
      const mockUsers = { data: [], total: 0, page: 1, pageSize: 5 };
      mockedAxios.get.mockResolvedValueOnce({ data: mockUsers });

      const result = await getUsers();

      expect(result).toEqual(mockUsers);
    });

    it('should propagate API errors', async () => {
      const error = new Error('Unauthorized');
      mockedAxios.get.mockRejectedValueOnce(error);

      await expect(getUsers()).rejects.toThrow('Unauthorized');
    });
  });
});
