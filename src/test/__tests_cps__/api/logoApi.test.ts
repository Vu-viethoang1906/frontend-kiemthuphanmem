import '@testing-library/jest-dom';
import axiosInstance from '../../../api/axiosInstance';
import { uploadLogoFile, deleteLogo, getCurrentLogo, getAllLogos, createLogo, updateLogo, activateLogo, getUlrLogo } from '../../../api/logoApi';

jest.mock('../../../api/axiosInstance', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
}));

describe('logoApi behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploadLogoFile: returns item on success and throws on failure', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: { url: '/logo.png' } } });
    const res = await uploadLogoFile(new FormData());
    expect(res.url).toBe('/logo.png');

    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({ data: { success: false, message: 'bad file' } });
    await expect(uploadLogoFile(new FormData())).rejects.toThrow('bad file');
  });

  it('uploadLogoFile: network error and unexpected shape are handled', async () => {
    // network error (no response)
    (axiosInstance.post as jest.Mock).mockRejectedValueOnce({ request: {} });
    await expect(uploadLogoFile(new FormData())).rejects.toBeDefined();

    // unexpected shape (success true but missing data)
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    await expect(uploadLogoFile(new FormData())).rejects.toThrow('Không upload được logo');
  });

  it('getCurrentLogo: returns item on success; throws on server message and no-response', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: { _id: '1', url: '/u' } } });
    await expect(getCurrentLogo()).resolves.toEqual({ _id: '1', url: '/u' });

    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: { success: false, message: 'err' } });
    await expect(getCurrentLogo()).rejects.toThrow('err');

    (axiosInstance.get as jest.Mock).mockRejectedValueOnce({ request: {} });
    await expect(getCurrentLogo()).rejects.toBeDefined();
  });

  it('getAllLogos/create/update/activate/delete: cover failure branches', async () => {
    // getAllLogos failure
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: { success: false, message: 'list-fail' } });
    await expect(getAllLogos()).rejects.toThrow('list-fail');

    // createLogo failure missing data
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    await expect(createLogo({ url: '/u' })).rejects.toThrow('Không tạo được logo');

    // updateLogo server message
    (axiosInstance.put as jest.Mock).mockResolvedValueOnce({ data: { success: false, message: 'update-fail' } });
    await expect(updateLogo('1', { url: '/x' })).rejects.toThrow('update-fail');

    // activateLogo missing data
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    await expect(activateLogo('1')).rejects.toThrow('Không kích hoạt được logo');

    // deleteLogo error message
    (axiosInstance.delete as jest.Mock).mockResolvedValueOnce({ data: { success: false, message: 'delete-fail' } });
    await expect(deleteLogo('1')).rejects.toThrow('delete-fail');
  });

  it('getUlrLogo: wraps current into array and handles empty', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: { _id: '1', url: '/u' } } });
    const res1 = await getUlrLogo();
    expect(res1).toEqual({ success: true, data: [{ _id: '1', url: '/u' }] });

    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, data: null } });
    const res2 = await getUlrLogo();
    expect(res2).toEqual({ success: true, data: [] });
  });

  test('removeLogo: resolves on success and throws on failure', async () => {
    (axiosInstance.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
    await expect(deleteLogo('id1')).resolves.toBeUndefined();

    (axiosInstance.delete as jest.Mock).mockResolvedValueOnce({ data: { success: false, message: 'not found' } });
    await expect(deleteLogo('id1')).rejects.toThrow('not found');
  });
});
