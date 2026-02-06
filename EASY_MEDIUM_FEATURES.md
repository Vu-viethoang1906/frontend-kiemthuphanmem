# 💡 Đề xuất Chức năng Dễ & Trung bình

## 🟢 Chức năng Dễ (1-3 giờ)

### 1. **Task Priority Colors** (Dễ)
**Mô tả:** Thêm màu sắc cho Priority trên TaskCard

**Frontend:**
- TaskCard hiển thị border/background màu theo priority:
  - High: Đỏ
  - Medium: Vàng
  - Low: Xanh lá
- Hoặc badge màu trên TaskCard

**Backend:**
- Không cần thay đổi (đã có priority field)

**Lợi ích:** Dễ nhận biết task quan trọng

---

### 2. **Task Due Date Warning** (Dễ)
**Mô tả:** Cảnh báo khi task sắp đến hạn

**Frontend:**
- TaskCard hiển thị warning icon nếu:
  - Due date trong 24h: ⚠️ Vàng
  - Due date đã qua: ❌ Đỏ
- Tooltip hiển thị số giờ còn lại

**Backend:**
- Không cần thay đổi (đã có due_date)

**Lợi ích:** Nhắc nhở task sắp hết hạn

---

### 3. **Task Quick Actions Menu** (Dễ)
**Mô tả:** Menu dropdown với các action nhanh trên TaskCard

**Frontend:**
- Icon "..." trên TaskCard
- Menu: Edit, Duplicate, Delete, Move to..., Assign to...
- Click action → Thực hiện ngay

**Backend:**
- Sử dụng API hiện có

**Lợi ích:** Thao tác nhanh hơn

---

### 4. **Task Duplicate** (Dễ)
**Mô tả:** Copy task để tạo task mới tương tự

**Frontend:**
- Button "Duplicate" trong Edit Modal hoặc Quick Actions
- Copy tất cả fields (trừ created_at, _id)
- Mở Create Modal với data đã copy

**Backend:**
- API: `POST /tasks/:id/duplicate`
- Copy task data, tạo task mới

**Lợi ích:** Tạo task tương tự nhanh chóng

---

### 5. **Task Search trong Board** (Dễ)
**Mô tả:** Search box để tìm task trong board hiện tại

**Frontend:**
- Search box ở header board
- Filter tasks theo title, description
- Highlight kết quả tìm được

**Backend:**
- Sử dụng API search hiện có: `/tasks/board/:board_id/search`

**Lợi ích:** Tìm task nhanh trong board lớn

---

## 🟡 Chức năng Trung bình (3-6 giờ)

### 1. **Task Subtasks với Progress** (Trung bình)
**Mô tả:** Subtasks có checkbox, tự động tính % hoàn thành

**Frontend:**
- Section Subtasks trong Edit Modal
- Mỗi subtask có checkbox
- Progress bar: "3/5 completed"
- Visual progress trên TaskCard

**Backend:**
- Model Subtask: task_id, title, completed, order
- API: CRUD subtasks
- Tính toán: `progress = completed_count / total_count`
- Update parent task progress

**Lợi ích:** Theo dõi tiến độ chi tiết

---

### 2. **Task Templates & Bulk Create** (Trung bình)
**Mô tả:** Tạo template và dùng để tạo nhiều task cùng lúc

**Frontend:**
- Trang "Task Templates"
- Form tạo template
- Bulk Create: Chọn template, nhập số lượng, tạo

**Backend:**
- Model TaskTemplate
- API: CRUD templates, bulk create
- Logic: Replace placeholders `{index}`, `{date}`

**Lợi ích:** Tạo nhiều task nhanh

---

### 3. **Task Custom Fields** (Trung bình)
**Mô tả:** Admin tạo custom fields cho board

**Frontend:**
- Board Settings → Custom Fields
- Add field: Text, Number, Date, Dropdown, Checkbox
- Hiển thị trong Edit Task Modal
- Filter theo custom fields

**Backend:**
- Model CustomField: board_id, name, type, options
- Thêm vào Task: `custom_fields: {field_id: value}`
- API: CRUD custom fields

**Lợi ích:** Linh hoạt theo nhu cầu từng board

---

### 4. **Task Activity Feed** (Trung bình)
**Mô tả:** Timeline tất cả activities trên task

**Frontend:**
- Tab "Activity" trong Edit Modal
- List activities: Created, Updated, Assigned, Commented, etc.
- Filter by user, date, action type
- Avatar + timestamp

**Backend:**
- Sử dụng ActivityLog hiện có
- Filter by task_id
- Format response cho timeline

**Lợi ích:** Theo dõi lịch sử thay đổi

---

### 5. **Task Quick Filters** (Trung bình)
**Mô tả:** Filter nhanh với các preset phổ biến

**Frontend:**
- Filter buttons: "My Tasks", "Due Today", "High Priority", "Unassigned"
- Click → Filter tasks trong board
- Multiple filters (AND logic)
- Clear filters

**Backend:**
- API filter tasks với query params
- Combine multiple filters

**Lợi ích:** Tìm task nhanh với các điều kiện phổ biến

---

### 6. **Task Move History** (Trung bình)
**Mô tả:** Xem lịch sử di chuyển task giữa các column

**Frontend:**
- Trong Task History hoặc Activity Feed
- Hiển thị: "Moved from 'To Do' to 'In Progress'"
- Timeline với dates

**Backend:**
- Sử dụng ActivityLog hoặc HistoryTask
- Log khi task move column

**Lợi ích:** Hiểu workflow của task

---

### 7. **Task Estimated vs Actual Time** (Trung bình)
**Mô tả:** So sánh estimate_hours với thời gian thực tế

**Frontend:**
- Hiển thị trong Task Detail:
  - Estimated: 8h
  - Actual: 6h (nếu có)
  - Difference: -2h (sớm hơn)
- Chart so sánh

**Backend:**
- Thêm field `actual_hours` vào Task
- API update actual_hours khi task done
- Tính toán difference

**Lợi ích:** Đánh giá độ chính xác estimate

---

### 8. **Task Tags Colors** (Trung bình)
**Mô tả:** Mỗi tag có màu riêng, hiển thị trên TaskCard

**Frontend:**
- Tag có màu background
- Hiển thị trên TaskCard với màu
- Filter by tag color

**Backend:**
- Thêm field `color` vào Tag model
- API update tag color

**Lợi ích:** Phân loại task bằng màu sắc

---

## 📊 So sánh

| Chức năng | Độ khó | Thời gian | Impact |
|-----------|--------|-----------|--------|
| Priority Colors | 🟢 Dễ | 1h | ⭐⭐⭐ |
| Due Date Warning | 🟢 Dễ | 1h | ⭐⭐⭐⭐ |
| Task Duplicate | 🟢 Dễ | 2h | ⭐⭐⭐ |
| Subtasks Progress | 🟡 TB | 4h | ⭐⭐⭐⭐⭐ |
| Task Templates | 🟡 TB | 4h | ⭐⭐⭐⭐ |
| Custom Fields | 🟡 TB | 5h | ⭐⭐⭐⭐⭐ |
| Activity Feed | 🟡 TB | 3h | ⭐⭐⭐⭐ |

---

## 💡 Đề xuất Ưu tiên

### Top 3 Dễ:
1. **Due Date Warning** - Rất hữu ích, dễ làm
2. **Task Duplicate** - Tiết kiệm thời gian
3. **Priority Colors** - Visual improvement

### Top 3 Trung bình:
1. **Subtasks với Progress** - Impact cao, không quá khó
2. **Task Templates** - Tiết kiệm thời gian khi tạo nhiều task
3. **Custom Fields** - Linh hoạt, nhiều use cases

---

Bạn muốn làm chức năng nào? 🚀
