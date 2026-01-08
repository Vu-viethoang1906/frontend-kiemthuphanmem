import React from 'react';
import { Download, Loader } from 'lucide-react';
import { useFileDownload } from '../hooks/useFileDownload';

interface FileDownloadButtonProps {
  fileId: string;
  fileName?: string;
  onDownloadSuccess?: () => void;
  className?: string;
  variant?: 'button' | 'icon';
}

/**
 * Component button để download file
 */
const FileDownloadButton: React.FC<FileDownloadButtonProps> = ({
  fileId,
  fileName,
  onDownloadSuccess,
  className = '',
  variant = 'button',
}) => {
  const { downloadFile, loading } = useFileDownload();

  const handleDownload = async () => {
    try {
      await downloadFile(fileId, fileName);
      onDownloadSuccess?.();
    } catch (error) {
      // Error is handled in the hook; surface a generic message if needed
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={loading ? 'Loading...' : `Download ${fileName || 'file'}`}
      >
        {loading ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Downloading...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Download</span>
        </>
      )}
    </button>
  );
};

export default FileDownloadButton;

