# Task Checklist Feature Implementation Guide

## 📋 Overview
Tính năng Task Checklist cho phép người dùng tạo danh sách kiểm tra (subtasks) cho mỗi task, theo dõi tiến độ hoàn thành, và quản lý các mục nhỏ hơn.

## 🗄️ Database Schema

### Checklist Model
```javascript
{
  _id: ObjectId,
  task_id: ObjectId (ref: Task),
  title: String (required),
  is_completed: Boolean (default: false),
  position: Number (for ordering),
  created_by: ObjectId (ref: User),
  deleted_at: Date (soft delete),
  created_at: Date,
  updated_at: Date
}
```

**Collection:** `Checklists`

## 🔌 API Endpoints

### Get Checklist Items for Task
```
GET /api/checklists/task/:taskId
Response:
{
  success: boolean,
  data: {
    items: [ChecklistItem[]],
    progress: {
      completed: number,
      total: number,
      percentage: number
    }
  }
}
```

### Create New Checklist Item
```
POST /api/checklists/task/:taskId
Body: { title: string }
Response: { success: boolean, message: string, data: ChecklistItem }
```

### Toggle Checklist Item Completion
```
PATCH /api/checklists/:checklistId/toggle
Response: { success: boolean, message: string, data: ChecklistItem }
```

### Update Checklist Item
```
PUT /api/checklists/:checklistId
Body: { title?: string, is_completed?: boolean }
Response: { success: boolean, message: string, data: ChecklistItem }
```

### Delete Checklist Item
```
DELETE /api/checklists/:checklistId
Response: { success: boolean, message: string }
```

### Reorder Checklist Items
```
PATCH /api/checklists/task/:taskId/reorder
Body: { items: [{ id: string, position: number }] }
Response: { success: boolean, message: string }
```

## 🎨 Frontend Components

### ChecklistSection Component
Located: `src/components/BoardDetail/ChecklistSection.tsx`

**Props:**
- `taskId?: string | null` - ID của task
- `onChecklistUpdate?: (progress) => void` - Callback khi checklist update

**Features:**
- Hiển thị danh sách checklist items
- Progress bar theo dõi tiến độ (X/Y hoàn thành)
- Thêm item mới
- Toggle completion status
- Xóa item
- Tự động cập nhật progress

**Usage:**
```tsx
<ChecklistSection
  taskId={taskId}
  onChecklistUpdate={(progress) => {
    console.log(`${progress.completed}/${progress.total} completed`);
  }}
/>
```

## 🔧 Integration in EditTaskModal

ChecklistSection được integrate vào EditTaskModal:
- Hiển thị sau Description field
- Chỉ visible khi task đã được lưu (có taskId)
- Tự động load khi modal mở
- Update realtime mà không cần refresh page

```tsx
{/* Checklist Section */}
{(editingTask._id || editingTask.id) && (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      Danh sách kiểm tra
    </label>
    <ChecklistSection
      taskId={editingTask._id || editingTask.id}
      onChecklistUpdate={undefined}
    />
  </div>
)}
```

## 📊 Progress Tracking

Progress được tính dựa trên:
- **Completed:** Số items có `is_completed = true`
- **Total:** Tổng số items (không bao gồm xóa)
- **Percentage:** `(completed / total) * 100`

Progress bar tự động update khi:
- Thêm item mới
- Toggle completion
- Xóa item

## 🔐 Permissions
- Chỉ user đã authenticate mới truy cập
- User có thể thao tác với checklist của task khi họ có quyền edit task

## 📝 Activity Logging
Mỗi hành động trên checklist được log:
- Thêm item: "đã thêm checklist item"
- Toggle: "đã đánh dấu checklist item hoàn thành/chưa hoàn thành"
- Xóa: "đã xóa checklist item"
- Reorder: "đã thay đổi thứ tự checklist"

## 🎯 Use Cases

### Ví dụ 1: Task phức tạp
```
Task: Build User Authentication System
├─ [ ] Design database schema
├─ [ ] Implement JWT authentication
├─ [ ] Create login endpoint
├─ [ ] Add password reset feature
├─ [ ] Write unit tests
└─ [ ] Deploy to production
```

### Ví dụ 2: Code Review
```
Task: Review PR #123
├─ [ ] Check code style
├─ [ ] Verify tests pass
├─ [ ] Check performance impact
├─ [ ] Review security concerns
└─ [ ] Approve changes
```

## 🚀 Future Enhancements

- [ ] Drag-and-drop reorder checklist items
- [ ] Due date cho individual checklist items
- [ ] Checklist templates
- [ ] Bulk checklist operations
- [ ] Checklist item dependencies
- [ ] Notifications on completion
- [ ] Checklist item assignees
- [ ] Custom checklist categories

## 🐛 Troubleshooting

### Checklist không load
- Kiểm tra taskId có valid không
- Xem network tab trong DevTools
- Check server logs cho 404 errors

### Toggle không hoạt động
- Xác nhận user đã authenticated
- Check CORS settings
- Verify API endpoint config

### Progress bar không update
- Clear browser cache
- Reload page
- Check onChecklistUpdate callback

## 📚 Related Files

**Backend:**
- Models: `models/checklist.model.js`
- Controllers: `controllers/checklist.controller.js`
- Routes: `router/checklist.routes.js`
- Model Index: `models/index.js` (updated)
- App Setup: `app.js` (updated)

**Frontend:**
- Component: `src/components/BoardDetail/ChecklistSection.tsx`
- Modal: `src/components/BoardDetail/EditTaskModal.tsx` (updated)
- Exports: `src/components/BoardDetail/index.ts` (updated)

## 🔗 API Documentation
Full API spec accessible at: `POST /api/checklists` and related endpoints

## 💡 Tips
1. Hãy sử dụng checklist cho các task phức tạp
2. Tên checklist item nên ngắn gọn và rõ ràng
3. Sắp xếp items theo thứ tự logic (dependencies)
4. Dùng để track subtasks hoặc acceptance criteria
