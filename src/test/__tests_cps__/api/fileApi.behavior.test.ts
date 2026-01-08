import { uploadFileToTask, deleteFile, getFilesByTask } from '../../../api/fileApi';
import axiosInstance from '../../../api/axiosInstance';

jest.mock('../../../api/axiosInstance', () => {
  const client = {
    post: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { __esModule: true, default: client };
});

describe('fileApi behavior spectrum', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploadFile: success returns server payload', async () => {
    const payload = { id: 'f1', name: 'doc.txt' };
    (axiosInstance.post as jest.Mock).mockResolvedValueOnce({ data: payload });
    const res = await uploadFileToTask('task-1', new File(['x'], 'doc.txt'));
    expect(res).toEqual(payload);
  });

  test('uploadFile: rejects on 413 (too large)', async () => {
    (axiosInstance.post as jest.Mock).mockRejectedValueOnce({ response: { status: 413 } });
    await expect(uploadFileToTask('task-1', new File(['x'], 'big.bin'))).rejects.toBeDefined();
  });

  test('listFiles: empty payload results in empty list', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce({ data: [] });
    const res = await getFilesByTask('task-1');
    expect(res).toEqual([]);
  });

  test('deleteFile: failure returns server error payload', async () => {
    const err = { response: { data: { message: 'cannot delete' }, status: 400 } };
    (axiosInstance.delete as jest.Mock).mockRejectedValueOnce(err);
    await expect(deleteFile('f1')).rejects.toBeDefined();
  });
});
