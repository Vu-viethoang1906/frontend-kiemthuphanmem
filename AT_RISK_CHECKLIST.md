# Checklist Kiểm Tra Chức Năng At-Risk Detection

## ✅ Đã Hoàn Thành

### 1. Backend API Integration
- [x] API Service (`src/api/atRiskApi.ts`) - Đã tạo đầy đủ
  - `detectAtRiskTasks()` - POST /at-risk/detect
  - `getAtRiskTasksByBoard()` - GET /at-risk/board/:board_id
  - `getAtRiskTasksByUser()` - GET /at-risk/user hoặc /at-risk/user/:user_id
  - `markTaskAsResolved()` - PUT /at-risk/resolve/:task_id

### 2. Frontend Components
- [x] Page Component (`src/pages/Analytics/AtRiskTasks.tsx`) - Đã tạo
  - Hiển thị danh sách at-risk tasks
  - Filter theo mức nguy cơ (High/Medium/Low)
  - Filter theo rule (unassigned_near_deadline, stuck_in_column, etc.)
  - Sort theo risk_score, due_date, detected_at
  - View mode: Board hoặc User
  - Stats cards
  - Risk reasons và recommendations
  - Actions: View task, Mark as resolved, Detect again

### 3. Routing & Navigation
- [x] Routes đã được thêm vào App.tsx
  - `/dashboard/analytics/at-risk`
  - `/admin/analytics/at-risk`
- [x] Menu items đã được thêm
  - Dashboard menu: "At-Risk Tasks"
  - Admin menu: "At-Risk Tasks"

### 4. Real-time Updates
- [x] Socket.IO integration
  - Listener cho event `at_risk_task_detected`
  - Tự động reload khi có task mới
  - NotificationBell cũng lắng nghe event này

## 🔍 Cần Kiểm Tra

### 1. API Endpoints Matching
- [x] POST /at-risk/detect - ✅ Match với backend
- [x] GET /at-risk/board/:board_id - ✅ Match với backend
- [x] GET /at-risk/user - ✅ Match với backend
- [x] PUT /at-risk/resolve/:task_id - ✅ Match với backend

### 2. Response Structure
Backend trả về:
```javascript
{
  success: true,
  data: AtRiskTask[],
  count: number
}
```

AtRiskTask structure từ backend (sau populate):
```javascript
{
  _id: string,
  task_id: {
    _id: string,
    title: string,
    due_date: string,
    assigned_to: { _id, full_name, username, email },
    column_id: { _id, name, order, isDone },
    estimate_hours: number
  },
  board_id: { _id: string, title: string },
  risk_score: number,
  risk_reasons: Array<{
    rule_name: string,
    score: number,
    details: object
  }>,
  recommendations: string[],
  detected_at: string,
  is_resolved: boolean
}
```

### 3. Socket Event Structure
Backend gửi event `at_risk_task_detected` với data:
```javascript
{
  task_id: string,
  task_title: string,
  board_id: string,
  risk_score: number,
  risk_reasons: Array,
  recommendations: Array,
  timestamp: string
}
```

✅ Frontend đã xử lý đúng với `data.task_title`

### 4. Edge Cases Cần Test

#### 4.1 Empty States
- [ ] Không có board nào
- [ ] Không có at-risk tasks
- [ ] Board không có tasks
- [ ] User không có assigned tasks

#### 4.2 Data Handling
- [ ] Task không có due_date
- [ ] Task không có assigned_to
- [ ] Task không có column_id
- [ ] Task không có estimate_hours
- [ ] Risk reasons rỗng
- [ ] Recommendations rỗng

#### 4.3 Error Handling
- [ ] API error khi detect
- [ ] API error khi get tasks
- [ ] API error khi mark as resolved
- [ ] Network error
- [ ] Unauthorized error

#### 4.4 Filter & Sort
- [ ] Filter theo risk level (high/medium/low)
- [ ] Filter theo rule
- [ ] Sort ascending/descending
- [ ] Combine filters

#### 4.5 Real-time Updates
- [ ] Socket event nhận được
- [ ] Auto reload sau khi nhận event
- [ ] Toast notification hiển thị
- [ ] NotificationBell cập nhật

## 🐛 Potential Issues & Fixes

### Issue 1: Task ID Access
**Location**: `AtRiskTasks.tsx` line 245, 518
**Problem**: `task.task_id._id` có thể fail nếu task_id là string
**Status**: ✅ Đã xử lý với optional chaining `task.task_id?._id`

### Issue 2: Socket Event Data
**Location**: `AtRiskTasks.tsx` line 176
**Problem**: Backend gửi `task_title` nhưng code check `task.title`
**Status**: ✅ Đã fix với `data.task_title || data.task?.title`

### Issue 3: Board ID Access
**Location**: `AtRiskTasks.tsx` line 517
**Problem**: `board_id` có thể là object hoặc string
**Status**: ✅ Đã xử lý với `task.board_id?._id || task.board_id?.id`

## 📝 Testing Steps

### Manual Testing Checklist

1. **Access Page**
   - [ ] Navigate to `/dashboard/analytics/at-risk`
   - [ ] Page loads without errors
   - [ ] Loading state hiển thị đúng

2. **View Mode: Board**
   - [ ] Select board từ dropdown
   - [ ] Tasks load đúng
   - [ ] Stats cards hiển thị đúng số lượng

3. **View Mode: User**
   - [ ] Switch sang User mode
   - [ ] Tasks của user hiển thị
   - [ ] Stats cards cập nhật

4. **Filtering**
   - [ ] Filter theo High risk
   - [ ] Filter theo Medium risk
   - [ ] Filter theo Low risk
   - [ ] Filter theo rule
   - [ ] Combine filters

5. **Sorting**
   - [ ] Sort by risk_score
   - [ ] Sort by due_date
   - [ ] Sort by detected_at
   - [ ] Toggle ascending/descending

6. **Actions**
   - [ ] Click "Phát hiện lại" - trigger detection
   - [ ] Click "Xem" - navigate to task
   - [ ] Click "Đã xử lý" - mark as resolved

7. **Real-time**
   - [ ] Socket event nhận được
   - [ ] Toast notification hiển thị
   - [ ] Tasks list tự động reload

8. **Error Handling**
   - [ ] Test với invalid board ID
   - [ ] Test với network offline
   - [ ] Test với unauthorized user

## 🎯 Expected Behavior

1. **Page Load**
   - Hiển thị loading spinner khi đang load
   - Hiển thị empty state nếu không có tasks
   - Hiển thị stats cards với số liệu chính xác

2. **Task Display**
   - Mỗi task hiển thị đầy đủ thông tin
   - Risk level badge với màu sắc đúng
   - Risk reasons với icon và details
   - Recommendations list
   - Action buttons hoạt động

3. **Real-time Updates**
   - Toast notification khi có task mới
   - Tasks list tự động reload
   - Stats cards cập nhật

4. **Error States**
   - Error toast hiển thị message rõ ràng
   - UI không bị crash
   - User có thể retry

## 📋 Code Quality

- [x] TypeScript types đầy đủ
- [x] Error handling
- [x] Loading states
- [x] Empty states
- [x] Responsive design
- [x] Dark mode support
- [x] Accessibility (có thể cải thiện thêm)

## 🚀 Next Steps (Optional Improvements)

1. Add pagination nếu có nhiều tasks
2. Add export to CSV/Excel
3. Add bulk actions (mark multiple as resolved)
4. Add filters cho date range
5. Add chart visualization cho risk trends
6. Add email notifications
7. Add unit tests
8. Add E2E tests

