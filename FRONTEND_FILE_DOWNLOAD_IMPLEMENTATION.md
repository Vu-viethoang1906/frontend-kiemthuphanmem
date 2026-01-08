# 📥 Hướng Dẫn Implement File Download Feature - Frontend

## 📋 Tổng Quan

Backend đã implement hệ thống quản lý và download file với các tính năng:
- ✅ Download file với authentication & authorization
- ✅ Track download count
- ✅ Quản lý metadata file
- ✅ Support cho Task attachments, Comment attachments, và Import files

**Base URL**: `/api/files`

**Authentication**: Tất cả endpoints đều yêu cầu Bearer token trong header

---

## 🔗 API Endpoints

### 1. Download File (Main Endpoint)

**Endpoint**: `GET /api/files/:id/download`

**Description**: Download file theo file ID. File sẽ được download với original filename.

**Headers**:
```javascript
{
  "Authorization": "Bearer <your_token>"
}
```

**Response**: 
- Success: File binary stream với headers:
  - `Content-Disposition: attachment; filename="<original_name>"`
  - `Content-Type: <mime_type>`
- Error: JSON response với `success: false`

**Example**:
```javascript
// React/Next.js example
const downloadFile = async (fileId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Download failed');
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : 'download';

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = decodeURIComponent(filename);
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Download error:', error);
    // Show error toast/notification
  }
};
```

---

### 2. Get File Metadata

**Endpoint**: `GET /api/files/:id`

**Description**: Lấy thông tin metadata của file (không download file)

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "file_id",
    "original_name": "document.pdf",
    "stored_name": "1234567890_abc123.pdf",
    "stored_path": "uploads/attachments/taskId/userId/filename",
    "file_type": "task_attachment",
    "related_type": "task",
    "related_id": "task_id",
    "uploaded_by": {
      "_id": "user_id",
      "username": "john_doe",
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "size": 1024000,
    "mime_type": "application/pdf",
    "download_count": 5,
    "is_public": false,
    "uploaded_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Example**:
```javascript
const getFileInfo = async (fileId) => {
  const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data.data;
};
```

---

### 3. Get Files by Task

**Endpoint**: `GET /api/files/task/:taskId`

**Description**: Lấy danh sách tất cả files đính kèm của một task

**Response**:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "file_id_1",
      "original_name": "document1.pdf",
      "size": 1024000,
      "mime_type": "application/pdf",
      "download_count": 3,
      "uploaded_by": { ... },
      "uploaded_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "file_id_2",
      "original_name": "image.jpg",
      "size": 512000,
      "mime_type": "image/jpeg",
      "download_count": 1,
      "uploaded_by": { ... },
      "uploaded_at": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

### 4. Get Files by Comment

**Endpoint**: `GET /api/files/comment/:commentId`

**Description**: Lấy danh sách tất cả files đính kèm của một comment

**Response**: Tương tự như Get Files by Task

---

### 5. Delete File

**Endpoint**: `DELETE /api/files/:id`

**Description**: Xóa file (soft delete). Chỉ uploader hoặc admin mới có quyền xóa.

**Response**:
```json
{
  "success": true,
  "message": "Xóa file thành công"
}
```

---

## 🔐 Authorization Rules

### Quyền truy cập file:

1. **Uploader**: Luôn có quyền download file của mình
2. **Board Members**: Có quyền download task/comment attachments trong board mà họ là member
3. **Admin/System_Manager**: Có quyền download tất cả files

### Error Responses:

```json
// 401 Unauthorized
{
  "success": false,
  "message": "Không có quyền truy cập"
}

// 403 Forbidden (nếu không có quyền)
{
  "success": false,
  "message": "Bạn không có quyền truy cập file này"
}

// 404 Not Found
{
  "success": false,
  "message": "File không tồn tại"
}
```

---

## 💡 UI/UX Implementation Suggestions

### 1. File Download Button Component

```jsx
// FileDownloadButton.jsx
import React, { useState } from 'react';
import { Download, Loader } from 'lucide-react';

const FileDownloadButton = ({ fileId, fileName, fileSize, onDownload }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownload(fileId);
      // Show success notification
    } catch (error) {
      // Show error notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{loading ? 'Đang tải...' : 'Tải xuống'}</span>
    </button>
  );
};
```

### 2. File List Component (Task/Comment Attachments)

```jsx
// FileList.jsx
import React, { useEffect, useState } from 'react';
import { FileText, Download, Trash2, File } from 'lucide-react';

const FileList = ({ taskId, commentId, onFileDeleted }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, [taskId, commentId]);

  const fetchFiles = async () => {
    try {
      const endpoint = taskId 
        ? `/api/files/task/${taskId}`
        : `/api/files/comment/${commentId}`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setFiles(data.data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    return '📎';
  };

  if (loading) return <div>Đang tải...</div>;
  if (files.length === 0) return <div className="text-gray-500">Chưa có file đính kèm</div>;

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file._id}
          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{file.original_name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)} • 
                {file.download_count} lượt tải • 
                {new Date(file.uploaded_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(file._id)}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded"
              title="Tải xuống"
            >
              <Download className="w-5 h-5" />
            </button>
            
            {/* Chỉ hiện nút xóa nếu là uploader hoặc admin */}
            {(isUploader(file) || isAdmin()) && (
              <button
                onClick={() => handleDelete(file._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded"
                title="Xóa file"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3. Download Hook (React)

```javascript
// useFileDownload.js
import { useState } from 'react';

export const useFileDownload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const downloadFile = async (fileId) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      // Get filename from header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          filename = decodeURIComponent(filename);
        }
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { downloadFile, loading, error };
};
```

---

## 📝 Integration với Task/Comment Attachments

### Khi upload attachment mới:

Backend sẽ trả về attachment object với field `file_id` và `url` mới:

```json
{
  "success": true,
  "message": "Tải lên file đính kèm thành công",
  "data": {
    "original_name": "document.pdf",
    "stored_name": "1234567890_abc123.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "uploaded_by": "user_id",
    "uploaded_at": "2024-01-15T10:30:00.000Z",
    "file_id": "file_id_from_file_model",
    "url": "/api/files/file_id_from_file_model/download"
  }
}
```

### Sử dụng URL mới:

```jsx
// Thay vì dùng url cũ (static file)
// <a href="/api/uploads/attachments/...">Download</a>

// Dùng file_id để download
<button onClick={() => downloadFile(attachment.file_id)}>
  Download {attachment.original_name}
</button>
```

---

## ⚠️ Important Notes

1. **File ID**: Sử dụng `file_id` từ attachment object (nếu có) hoặc `_id` từ file metadata
2. **Backward Compatibility**: File cũ (upload trước khi có File model) có thể không có `file_id`. Cần check:
   ```javascript
   if (attachment.file_id) {
     // Use new download endpoint
     downloadFile(attachment.file_id);
   } else {
     // Fallback to old static URL
     window.open(attachment.url);
   }
   ```
3. **Error Handling**: Luôn handle các trường hợp:
   - 401: Token hết hạn → Redirect to login
   - 403: Không có quyền → Show error message
   - 404: File không tồn tại → Show error message
   - Network error → Show retry option

4. **Download Count**: Backend tự động track download count. Có thể hiển thị trong UI để user biết file được download bao nhiêu lần.

5. **File Size**: Hiển thị file size để user biết trước khi download (đặc biệt với file lớn)

---

## 🧪 Testing Checklist

- [ ] Download file thành công với valid token
- [ ] Download file fail với invalid/expired token
- [ ] Download file fail khi không có quyền (403)
- [ ] Download file với filename có ký tự đặc biệt (tiếng Việt, emoji, etc.)
- [ ] Download file lớn (>10MB) - test progress indicator
- [ ] Download multiple files liên tiếp
- [ ] Get file metadata thành công
- [ ] Get files by task/comment
- [ ] Delete file (chỉ uploader/admin)
- [ ] UI hiển thị download count
- [ ] UI hiển thị file size, upload date
- [ ] Error messages hiển thị đúng

---

## 📞 Support

Nếu có vấn đề khi implement, check:
1. Token có valid không?
2. File ID có đúng format không?
3. User có quyền truy cập file không?
4. Network request có bị block không?

**Happy Coding! 🚀**


