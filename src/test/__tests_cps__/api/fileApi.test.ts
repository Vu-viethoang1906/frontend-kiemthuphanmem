import axiosInstance from '../../../api/axiosInstance';
import {
  getFilesByTask,
  getFilesByComment,
  deleteFile,
  uploadFileToTask,
  uploadFileToComment,
  deleteFileFromTask,
  deleteFileFromComment,
  importFileTask,
  downloadFile,
} from '../../../api/fileApi';

jest.mock('../../../api/axiosInstance');

describe('fileApi', () => {
  const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFilesByTask', () => {
    it('should fetch files by task ID', async () => {
      const taskId = 'task123';
      const mockData = { data: [{ id: 'file1', name: 'test.pdf' }] };
      mockAxios.get.mockResolvedValue(mockData);

      const result = await getFilesByTask(taskId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/files/task/${encodeURIComponent(taskId)}`);
      expect(result).toEqual(mockData.data);
    });

    it('should throw error for invalid taskId', async () => {
      await expect(getFilesByTask('')).rejects.toThrow('Invalid taskId');
      await expect(getFilesByTask('task@123')).rejects.toThrow('Invalid taskId');
    });
  });

  describe('getFilesByComment', () => {
    it('should fetch files by comment ID', async () => {
      const commentId = 'comment123';
      const mockData = { data: [{ id: 'file1', name: 'test.pdf' }] };
      mockAxios.get.mockResolvedValue(mockData);

      const result = await getFilesByComment(commentId);

      expect(mockAxios.get).toHaveBeenCalledWith(`/files/comment/${encodeURIComponent(commentId)}`);
      expect(result).toEqual(mockData.data);
    });

    it('should throw error for invalid commentId', async () => {
      await expect(getFilesByComment('')).rejects.toThrow('Invalid commentId');
    });
  });

  describe('deleteFile', () => {
    it('should delete file by ID', async () => {
      const fileId = 'file123';
      const mockData = { success: true };
      mockAxios.delete.mockResolvedValue({ data: mockData });

      const result = await deleteFile(fileId);

      expect(mockAxios.delete).toHaveBeenCalledWith(`/files/${encodeURIComponent(fileId)}`);
      expect(result).toEqual(mockData);
    });

    it('should throw error for invalid fileId', async () => {
      await expect(deleteFile('')).rejects.toThrow('Invalid fileId');
    });
  });

  describe('uploadFileToTask', () => {
    it('should upload file to task', async () => {
      const taskId = 'task123';
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockData = { id: 'file1', name: 'test.pdf' };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await uploadFileToTask(taskId, file);

      expect(mockAxios.post).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should throw error for invalid file', async () => {
      const taskId = 'task123';
      const invalidFile = null as any;

      await expect(uploadFileToTask(taskId, invalidFile)).rejects.toThrow('Invalid file');
    });

    it('should throw error for empty file', async () => {
      const taskId = 'task123';
      const emptyFile = new File([], 'empty.pdf');

      await expect(uploadFileToTask(taskId, emptyFile)).rejects.toThrow('File is empty');
    });

    it('should throw error for file too large', async () => {
      const taskId = 'task123';
      const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.pdf');

      await expect(uploadFileToTask(taskId, largeFile)).rejects.toThrow('File size exceeds');
    });

    it('should handle 413 error', async () => {
      const taskId = 'task123';
      const file = new File(['content'], 'test.pdf');
      mockAxios.post.mockRejectedValue({ response: { status: 413 } });

      await expect(uploadFileToTask(taskId, file)).rejects.toThrow('File too large');
    });
  });

  describe('uploadFileToComment', () => {
    it('should upload file to comment', async () => {
      const commentId = 'comment123';
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockData = { id: 'file1', name: 'test.pdf' };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await uploadFileToComment(commentId, file);

      expect(mockAxios.post).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should handle 413 error', async () => {
      const commentId = 'comment123';
      const file = new File(['content'], 'test.pdf');
      mockAxios.post.mockRejectedValue({ response: { status: 413 } });

      await expect(uploadFileToComment(commentId, file)).rejects.toThrow('File too large');
    });
  });

  describe('deleteFileFromTask', () => {
    it('should delete file from task', async () => {
      const taskId = 'task123';
      const attachmentIndex = 0;
      const mockData = { success: true };
      mockAxios.delete.mockResolvedValue({ data: mockData });

      const result = await deleteFileFromTask(taskId, attachmentIndex);

      expect(mockAxios.delete).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should throw error for invalid attachmentIndex', async () => {
      const taskId = 'task123';
      await expect(deleteFileFromTask(taskId, -1)).rejects.toThrow('Invalid attachmentIndex');
      await expect(deleteFileFromTask(taskId, 1.5)).rejects.toThrow('Invalid attachmentIndex');
    });
  });

  describe('deleteFileFromComment', () => {
    it('should delete file from comment', async () => {
      const commentId = 'comment123';
      const attachmentIndex = 0;
      const mockData = { success: true };
      mockAxios.delete.mockResolvedValue({ data: mockData });

      const result = await deleteFileFromComment(commentId, attachmentIndex);

      expect(mockAxios.delete).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('importFileTask', () => {
    it('should import file task', async () => {
      const formData = new FormData();
      const file = new File(['content'], 'import.csv', { type: 'text/csv' });
      formData.append('file', file);
      const mockData = { success: true };
      mockAxios.post.mockResolvedValue({ data: mockData });

      const result = await importFileTask(formData);

      expect(mockAxios.post).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should throw error for invalid FormData', async () => {
      await expect(importFileTask(null as any)).rejects.toThrow('Invalid data: must be FormData');
    });
  });

  describe('downloadFile', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
      Object.defineProperty(window, 'URL', {
        writable: true,
        value: {
          createObjectURL: jest.fn(() => 'blob:url'),
          revokeObjectURL: jest.fn(),
        },
      });
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn(),
      };
      document.createElement = jest.fn(() => mockLink as any);
      localStorage.setItem('token', 'test-token');
    });

    afterEach(() => {
      localStorage.clear();
      jest.clearAllMocks();
    });

    it('should download file with /uploads/ path', async () => {
      const fileUrl = '/uploads/file.pdf';
      const fileName = 'test.pdf';
      
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob()),
        ok: true,
      } as any);

      await downloadFile(fileUrl, fileName);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should download file with /api/uploads/ path', async () => {
      const fileUrl = '/api/uploads/file.pdf';
      const fileName = 'test.pdf';
      
      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(new Blob()),
        ok: true,
      } as any);

      await downloadFile(fileUrl, fileName);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw error for invalid URL with path traversal', async () => {
      await expect(downloadFile('../file.pdf', 'test.pdf')).rejects.toThrow('Invalid file URL');
    });

    it('should throw error for empty URL', async () => {
      await expect(downloadFile('', 'test.pdf')).rejects.toThrow('Invalid file URL');
    });

    it('should throw error for invalid URL format', async () => {
      await expect(downloadFile('invalid-path', 'test.pdf')).rejects.toThrow('Invalid file URL format');
    });

    it('should handle fetch error', async () => {
      const fileUrl = '/uploads/file.pdf';
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as any);

      await expect(downloadFile(fileUrl, 'test.pdf')).rejects.toThrow('Failed to download file');
    });
  });
});

