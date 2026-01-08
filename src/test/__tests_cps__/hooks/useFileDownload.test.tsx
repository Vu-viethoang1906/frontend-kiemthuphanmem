import { renderHook, waitFor, act } from '@testing-library/react';
import { useFileDownload } from '../../../hooks/useFileDownload';
import axiosInstance from '../../../api/axiosInstance';
import toast from 'react-hot-toast';

jest.mock('../../../api/axiosInstance');
jest.mock('react-hot-toast');

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('useFileDownload hook', () => {
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock DOM methods
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
    
    // Mock click method
    HTMLAnchorElement.prototype.click = jest.fn();
  });

  afterEach(() => {
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should download file successfully with provided filename', async () => {
    const mockBlob = new Blob(['file content'], { type: 'text/plain' });
    mockAxios.get.mockResolvedValue({
      data: mockBlob,
      headers: { 'content-type': 'text/plain' },
    });

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.downloadFile('file-123', 'test.txt');
    });

    expect(mockAxios.get).toHaveBeenCalledWith('/files/file-123/download', {
      responseType: 'blob',
    });
    expect(toast.success).toHaveBeenCalledWith('Tải file thành công');
  });

  it('should extract filename from Content-Disposition header', async () => {
    const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
    mockAxios.get.mockResolvedValue({
      data: mockBlob,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="document.pdf"',
      },
    });

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.downloadFile('file-456');
    });

    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle UTF-8 encoded filename in Content-Disposition', async () => {
    const mockBlob = new Blob(['file content'], { type: 'image/png' });
    mockAxios.get.mockResolvedValue({
      data: mockBlob,
      headers: {
        'content-type': 'image/png',
        'Content-Disposition': "attachment; filename*=UTF-8''%E6%96%87%E4%BB%B6.png",
      },
    });

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.downloadFile('file-789');
    });

    expect(toast.success).toHaveBeenCalled();
  });

  it('should use default filename when not provided and no header', async () => {
    const mockBlob = new Blob(['file content']);
    mockAxios.get.mockResolvedValue({
      data: mockBlob,
      headers: {},
    });

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.downloadFile('file-default');
    });

    expect(toast.success).toHaveBeenCalled();
  });

  it('should handle download error', async () => {
    const errorMessage = 'File not found';
    mockAxios.get.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      try {
        await result.current.downloadFile('invalid-file');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(toast.error).toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
  });
});
