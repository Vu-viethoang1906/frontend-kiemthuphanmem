import {
  getBasicSidebarConfig,
  updateBasicSidebarItem,
  uploadBasicSidebarIcon,
  getAllSidebarItems,
  getMenuItems,
  updateSidebarItem,
  createSidebarItem,
  deleteSidebarItem,
  updateMenuOrder,
  BasicSidebarConfig,
  SidebarItem,
} from '../../../api/sidebarApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance', () => {
  const client = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { __esModule: true, default: client };
});

describe('sidebarApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const ok = (data: any) => ({ data: { success: true, data } });
  const fail = (message?: string) => ({ data: { success: false, message } });

  test('getBasicSidebarConfig: success returns array', async () => {
    const payload: BasicSidebarConfig[] = [
      { key: 'dashboard', label: 'Dashboard', path: '/dashboard', name: 'Dashboard', icon: 'home' },
    ];
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce(ok(payload));
    const res = await getBasicSidebarConfig();
    expect(res).toEqual(payload);
  });

  test('getBasicSidebarConfig: failure throws with message', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce(fail('oops'));
    await expect(getBasicSidebarConfig()).rejects.toThrow('oops');
  });

  test('updateBasicSidebarItem: success returns item', async () => {
    const item: BasicSidebarConfig = { key: 'projects', label: 'Projects', path: '/dashboard/projects', name: 'Projects', icon: 'grid' };
    (axiosInstance.put as jest.Mock).mockResolvedValueOnce(ok(item));
    const res = await updateBasicSidebarItem('projects', { name: 'Projects' });
    expect(res).toEqual(item);
  });

  test('updateBasicSidebarItem: failure throws', async () => {
    (axiosInstance.put as jest.Mock).mockResolvedValueOnce(fail('update failed'));
    await expect(updateBasicSidebarItem('projects', { name: 'x' })).rejects.toThrow('update failed');
  });

  test('uploadBasicSidebarIcon: success returns updated config', async () => {
    const item: BasicSidebarConfig = { key: 'reports', label: 'Reports', path: '/dashboard/reports', name: 'Reports', icon: 'chart' };
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce(ok(item));
    const file = new File(['x'], 'icon.png', { type: 'image/png' });
    const res = await uploadBasicSidebarIcon('reports', file);
    expect(res).toEqual(item);
  });

  test('uploadBasicSidebarIcon: 404 transforms to detailed message', async () => {
    const error = {
      response: {
        status: 404,
        data: { message: 'Not Found' },
        config: { url: '/sidebar-items/basic/reports/icon' },
      },
    };
    (axiosInstance.post as jest.Mock).mockRejectedValueOnce(error);
    const file = new File(['x'], 'icon.png', { type: 'image/png' });
    await expect(uploadBasicSidebarIcon('reports', file)).rejects.toThrow('API not found: /sidebar-items/basic/reports/icon');
  });

  test('uploadBasicSidebarIcon: no response yields network message', async () => {
    const error = { request: {} };
    (axiosInstance.post as jest.Mock).mockRejectedValueOnce(error);
    const file = new File(['x'], 'icon.png', { type: 'image/png' });
    await expect(uploadBasicSidebarIcon('reports', file)).rejects.toThrow('No response from server');
  });

  test('uploadBasicSidebarIcon: other error yields default message', async () => {
    const error = { message: 'boom' };
    (axiosInstance.post as jest.Mock).mockRejectedValueOnce(error);
    const file = new File(['x'], 'icon.png', { type: 'image/png' });
    await expect(uploadBasicSidebarIcon('reports', file)).rejects.toThrow('Error occurred while uploading image');
  });

  test('getAllSidebarItems: success returns list', async () => {
    const items: SidebarItem[] = [{ _id: '1', menuType: 'main', name: 'Dash', icon: 'home', path: '/dashboard', order: 1, isActive: true }];
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce(ok(items));
    const res = await getAllSidebarItems();
    expect(res).toEqual(items);
  });

  test('getAllSidebarItems: failure throws', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce(fail('load failed'));
    await expect(getAllSidebarItems()).rejects.toThrow('load failed');
  });

  test('getMenuItems: success returns list', async () => {
    const items: SidebarItem[] = [{ _id: '2', menuType: 'admin', name: 'Admin', icon: 'shield', path: '/admin', order: 1, isActive: true }];
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce(ok(items));
    const res = await getMenuItems('admin');
    expect(res).toEqual(items);
  });

  test('getMenuItems: non-success returns empty array', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce(fail('nope'));
    const res = await getMenuItems('main');
    expect(res).toEqual([]);
  });

  test('updateSidebarItem: success returns item', async () => {
    const item: SidebarItem = { _id: '3', menuType: 'main', name: 'Groups', icon: 'users', path: '/dashboard/groups', order: 2, isActive: true };
    (axiosInstance.put as jest.Mock).mockResolvedValueOnce(ok(item));
    const res = await updateSidebarItem('3', { name: 'Groups' });
    expect(res).toEqual(item);
  });

  test('updateSidebarItem: failure throws', async () => {
    (axiosInstance.put as jest.Mock).mockResolvedValueOnce(fail('update failed'));
    await expect(updateSidebarItem('3', { name: 'x' })).rejects.toThrow('update failed');
  });

  test('createSidebarItem: success returns item', async () => {
    const item: SidebarItem = { _id: '4', menuType: 'personal', name: 'Profile', icon: 'user', path: '/dashboard/profile', order: 9, isActive: true };
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce(ok(item));
    const { _id, createdAt, updatedAt, ...payload } = item;
    const res = await createSidebarItem(payload);
    expect(res).toEqual(item);
  });

  test('createSidebarItem: failure throws', async () => {
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce(fail('create failed'));
    await expect(createSidebarItem({ _id: 'x' } as any)).rejects.toThrow('create failed');
  });

  test('deleteSidebarItem: success resolves', async () => {
    (axiosInstance.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    await expect(deleteSidebarItem('5')).resolves.toBeUndefined();
  });

  test('deleteSidebarItem: failure throws', async () => {
    (axiosInstance.delete as jest.Mock).mockResolvedValueOnce(fail('delete failed'));
    await expect(deleteSidebarItem('5')).rejects.toThrow('delete failed');
  });

  test('updateMenuOrder: success resolves', async () => {
    (axiosInstance.put as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    await expect(updateMenuOrder('main', ['1','2'])).resolves.toBeUndefined();
  });

  test('updateMenuOrder: failure throws', async () => {
    (axiosInstance.put as jest.Mock).mockResolvedValueOnce(fail('order failed'));
    await expect(updateMenuOrder('admin', ['a'])).rejects.toThrow('order failed');
  });
});

export {};