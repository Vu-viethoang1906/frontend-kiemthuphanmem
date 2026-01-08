import React, { useEffect, useState } from 'react';
import { Download, Trash2, FileText, File, Image, FileSpreadsheet, FileType } from 'lucide-react';
import { getFilesByTask, getFilesByComment, deleteFile } from '../api/fileApi';
import { useFileDownload } from '../hooks/useFileDownload';
import { useModal } from './ModalProvider';
import toast from 'react-hot-toast';
import { handleApiError } from '../utils/errorHandler';

interface FileItem {
  _id: string;
  original_name: string;
  size: number;
  mime_type?: string;
  download_count?: number;
  uploaded_by?: {
    _id: string;
    username: string;
    full_name?: string;
    email?: string;
  } | string;
  uploaded_at: string;
  file_id?: string; // For backward compatibility
}

interface FileListProps {
  taskId?: string;
  commentId?: string;
  onFileDeleted?: () => void;
  showDeleteButton?: boolean;
  className?: string;
}

/**
 * Component hiển thị danh sách files đính kèm của task hoặc comment
 */
const FileList: React.FC<FileListProps> = ({
  taskId,
  commentId,
  onFileDeleted,
  showDeleteButton = true,
  className = '',
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { downloadFile, loading: downloading } = useFileDownload();
  const { confirm } = useModal();
  const userId = localStorage.getItem('userId') || '';
  const roles = JSON.parse(localStorage.getItem('roles') || '[]');
  const isAdmin = roles.includes('admin') || roles.includes('System_Manager');

  useEffect(() => {
    if (taskId || commentId) {
      fetchFiles();
    }
  }, [taskId, commentId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      let response;
      if (taskId) {
        response = await getFilesByTask(taskId);
      } else if (commentId) {
        response = await getFilesByComment(commentId);
      } else {
        return;
      }

      setFiles(response.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to load file list');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      // Sử dụng file_id nếu có (new format), nếu không dùng _id
      const fileId = file.file_id || file._id;
      await downloadFile(fileId, file.original_name);
      // Refresh file list để cập nhật download_count
      fetchFiles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to download file');
    }
  };

  const handleDelete = async (file: FileItem) => {
    const isUploader = typeof file.uploaded_by === 'object' 
      ? file.uploaded_by._id === userId
      : file.uploaded_by === userId;

    if (!isUploader && !isAdmin) {
      toast.error('You do not have permission to delete this file');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete File',
      message: `Are you sure you want to delete "${file.original_name}"? This action cannot be undone.`,
      variant: 'error',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    try {
      const fileId = file.file_id || file._id;
      await deleteFile(fileId);
      toast.success('File deleted successfully');
      fetchFiles();
      onFileDeleted?.();
    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Unable to delete file');
      toast.error(errorMessage);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="w-5 h-5" />;
    
    if (mimeType.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    if (mimeType.includes('text')) return <FileType className="w-5 h-5 text-gray-600" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const canDelete = (file: FileItem): boolean => {
    if (!showDeleteButton) return false;
    const isUploader = typeof file.uploaded_by === 'object' 
      ? file.uploaded_by._id === userId
      : file.uploaded_by === userId;
    return isUploader || isAdmin;
  };

  if (loading) {
    return (
      <div className={`text-center py-4 text-gray-500 ${className}`}>
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-sm">Loading...</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`text-gray-500 text-sm py-2 ${className}`}>
        No attachments
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((file) => {
        const fileId = file.file_id || file._id;
        const isUploader = typeof file.uploaded_by === 'object' 
          ? file.uploaded_by._id === userId
          : file.uploaded_by === userId;
        const canDeleteFile = canDelete(file);

        return (
          <div
            key={file._id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getFileIcon(file.mime_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate" title={file.original_name}>
                  {file.original_name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(file.size)}
                  {file.download_count !== undefined && ` • ${file.download_count} downloads`}
                  {` • ${formatDate(file.uploaded_at)}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleDownload(file)}
                disabled={downloading}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              
              {canDeleteFile && (
                <button
                  onClick={() => handleDelete(file)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Delete file"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FileList;

