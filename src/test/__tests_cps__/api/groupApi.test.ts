import axiosInstance from '../../../api/axiosInstance';
import {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addGroupMember,
  addBulkGroupMembers,
  getGroupMembers,
} from '../../../api/groupApi';

jest.mock('../../../api/axiosInstance');

describe('groupApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroup', () => {
    it('should create a group', async () => {
      const data = { name: 'New Group', center_id: 'center1' };
      const mockResponse = { data: { id: 'group1', ...data } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await createGroup(data);

      expect(mockAxios.post).toHaveBeenCalledWith('/groups', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getAllGroups', () => {
    it('should fetch all groups without params', async () => {
      const mockResponse = { data: [{ id: 'group1', name: 'Group 1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await getAllGroups();

      expect(mockAxios.get).toHaveBeenCalledWith('/groups', { params: undefined });
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch all groups with params', async () => {
      const params = { page: 1, limit: 10, search: 'test' };
      const mockResponse = { data: [{ id: 'group1', name: 'Test Group' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await getAllGroups(params);

      expect(mockAxios.get).toHaveBeenCalledWith('/groups', { params });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getGroupById', () => {
    it('should fetch group by ID', async () => {
      const id = 'group1';
      const mockResponse = { data: { id, name: 'Group 1' } };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await getGroupById(id);

      expect(mockAxios.get).toHaveBeenCalledWith(`/groups/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('updateGroup', () => {
    it('should update a group', async () => {
      const id = 'group1';
      const data = { name: 'Updated Group' };
      const mockResponse = { data: { id, ...data } };
      mockAxios.put.mockResolvedValue(mockResponse);

      const result = await updateGroup(id, data);

      expect(mockAxios.put).toHaveBeenCalledWith(`/groups/${id}`, data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('deleteGroup', () => {
    it('should delete a group', async () => {
      const id = 'group1';
      const mockResponse = { data: { success: true } };
      mockAxios.delete.mockResolvedValue(mockResponse);

      const result = await deleteGroup(id);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/groups/${id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('addGroupMember', () => {
    it('should add group member', async () => {
      const data = { group_id: 'group1', user_id: 'user1', role_in_group: 'member' };
      const mockResponse = { data: { id: 'gm1', ...data } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await addGroupMember(data);

      expect(mockAxios.post).toHaveBeenCalledWith('/groupMember', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('addBulkGroupMembers', () => {
    it('should add bulk group members', async () => {
      const data = {
        group_id: 'group1',
        members: [
          { user_id: 'user1', role_in_group: 'member' },
          { user_id: 'user2', role_in_group: 'admin' },
        ],
      };
      const mockResponse = { data: { success: true, added: 2 } };
      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await addBulkGroupMembers(data);

      expect(mockAxios.post).toHaveBeenCalledWith('/groupMember', data);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getGroupMembers', () => {
    it('should fetch group members', async () => {
      const group_id = 'group1';
      const mockResponse = { data: [{ id: 'gm1', user_id: 'user1' }] };
      mockAxios.get.mockResolvedValue(mockResponse);

      const result = await getGroupMembers(group_id);

      expect(mockAxios.get).toHaveBeenCalledWith(`/groupMember/${group_id}`);
      expect(result).toEqual(mockResponse.data);
    });
  });
});

