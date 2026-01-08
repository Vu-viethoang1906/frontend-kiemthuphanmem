import { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandler';

/**
 * Hook để xử lý download file
 * @returns { downloadFile: (fileId, filename?) => Promise<void>, loading: boolean, error: string | null }
 */
export const useFileDownload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Download file by file ID
   * @param fileId - File ID
   * @param filename - Optional filename (nếu không có sẽ lấy từ Content-Disposition header)
   */
  const handleDownload = async (fileId: string, filename?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Gọi API download với axios (responseType: 'blob')
      const response = await axiosInstance.get(`/files/${fileId}/download`, {
        responseType: 'blob',
      });

      // Lấy filename từ Content-Disposition header
      let finalFilename = filename || 'download';
      const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
      
      if (contentDisposition) {
        // Parse filename từ Content-Disposition header
        // Format: attachment; filename="filename.ext" hoặc attachment; filename*=UTF-8''filename.ext
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          let extractedFilename = filenameMatch[1].replace(/['"]/g, '');
          // Xử lý UTF-8 encoded filename (filename*=UTF-8''...)
          if (extractedFilename.startsWith("UTF-8''")) {
            extractedFilename = decodeURIComponent(extractedFilename.replace("UTF-8''", ""));
          } else {
            extractedFilename = decodeURIComponent(extractedFilename);
          }
          finalFilename = extractedFilename;
        }
      }

      // Tạo blob và trigger download
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Tải file thành công');
      return { success: true };
    } catch (err: any) {
      // Nếu response là JSON error (không phải blob)
      if (err.response?.data && err.response.data instanceof Blob) {
        // Try to parse error message from blob
        const text = await err.response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Download failed');
        } catch {
          throw new Error('Download failed');
        }
      }
      
      const errorMessage = handleApiError(err, 'Không thể tải file');
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { 
    downloadFile: handleDownload, 
    loading, 
    error 
  };
};

