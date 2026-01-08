# Hướng Dẫn Test Chức Năng At-Risk Detection

## 📋 Bước 1: Chuẩn Bị

### 1.1. Đảm bảo Backend đang chạy
```bash
# Kiểm tra backend đang chạy ở port 3005 (hoặc port bạn đã config)
# Backend API endpoint: http://localhost:3005/api/at-risk
```

### 1.2. Đảm bảo Frontend đang chạy
```bash
# Chạy frontend
npm start
# Hoặc
yarn start

# Frontend sẽ chạy ở http://localhost:3000
```

### 1.3. Đăng nhập vào hệ thống
- Mở trình duyệt và truy cập `http://localhost:3000`
- Đăng nhập với tài khoản có quyền `VIEW_BOARD`, `admin`, hoặc `System_Manager`

## 🚀 Bước 2: Truy Cập Trang At-Risk Tasks

### Cách 1: Qua Menu
1. Sau khi đăng nhập, bạn sẽ thấy sidebar bên trái
2. Click vào menu **"Analytic"** (hoặc **"Analytics"**)
3. Trong submenu, click vào **"At-Risk Tasks"**
4. URL sẽ là: `/dashboard/analytics/at-risk` hoặc `/admin/analytics/at-risk`

### Cách 2: Truy cập trực tiếp
- Gõ URL: `http://localhost:3000/dashboard/analytics/at-risk`
- Hoặc: `http://localhost:3000/admin/analytics/at-risk` (nếu là admin)

## 🧪 Bước 3: Test Các Chức Năng

### 3.1. Test Load Tasks (Theo Board)

**Mục đích**: Kiểm tra xem có load được danh sách at-risk tasks từ board không

**Các bước**:
1. Trên trang At-Risk Tasks, đảm bảo **"Chế độ xem"** đang là **"Theo Board"**
2. Chọn một board từ dropdown **"Board"**
3. Đợi vài giây để hệ thống load tasks
4. **Kết quả mong đợi**:
   - Nếu có tasks: Hiển thị danh sách tasks với thông tin đầy đủ
   - Nếu không có: Hiển thị message "Không có task nào có nguy cơ trễ hạn"
   - Stats cards hiển thị số lượng tasks theo từng mức nguy cơ

**Lưu ý**: Nếu không có tasks, bạn cần tạo tasks có nguy cơ trễ hạn (xem Bước 4)

---

### 3.2. Test Load Tasks (Theo User)

**Mục đích**: Kiểm tra xem có load được tasks của user hiện tại không

**Các bước**:
1. Chuyển **"Chế độ xem"** sang **"Theo User"**
2. Hệ thống sẽ tự động load tasks của user đang đăng nhập
3. **Kết quả mong đợi**: Tương tự như test theo Board

---

### 3.3. Test Nút "Phát hiện lại" (Manual Detection)

**Mục đích**: Kiểm tra chức năng trigger detection thủ công

**Các bước**:
1. Click nút **"Phát hiện lại"** ở góc trên bên phải
2. Đợi vài giây (có thể thấy loading spinner)
3. **Kết quả mong đợi**:
   - Toast notification hiển thị: "Phát hiện X task(s) có nguy cơ trễ hạn"
   - Danh sách tasks được reload
   - Stats cards cập nhật

**Lưu ý**: Nếu không có tasks mới, có thể thấy message "Phát hiện 0 task(s)..."

---

### 3.4. Test Filter Theo Mức Nguy Cơ

**Mục đích**: Kiểm tra filter hoạt động đúng không

**Các bước**:
1. Đảm bảo có ít nhất một vài tasks trong danh sách
2. Chọn filter **"Mức nguy cơ"**:
   - **"Tất cả"**: Hiển thị tất cả tasks
   - **"Cao (≥1.5)"**: Chỉ hiển thị tasks có risk_score >= 1.5
   - **"Trung bình (0.8-1.5)"**: Chỉ hiển thị tasks có risk_score từ 0.8 đến 1.5
   - **"Thấp (<0.8)"**: Chỉ hiển thị tasks có risk_score < 0.8
3. **Kết quả mong đợi**: Danh sách tasks được filter đúng theo mức nguy cơ

---

### 3.5. Test Filter Theo Rule

**Mục đích**: Kiểm tra filter theo rule cụ thể

**Các bước**:
1. Chọn filter **"Quy tắc"**:
   - **"Tất cả"**: Hiển thị tất cả
   - **"Chưa gán & gần hạn"**: Tasks chưa có assigned_to và gần deadline
   - **"Stuck ở cột"**: Tasks bị stuck ở một cột > 5 ngày
   - **"Nhiều task quá hạn"**: User có > 3 overdue tasks
   - **"Ước tính cao & ít thời gian"**: estimate_hours > 16h nhưng còn ít time
2. **Kết quả mong đợi**: Chỉ hiển thị tasks có rule tương ứng

---

### 3.6. Test Sort

**Mục đích**: Kiểm tra sắp xếp hoạt động đúng không

**Các bước**:
1. Chọn **"Sắp xếp"**:
   - **"Điểm nguy cơ"**: Sort theo risk_score
   - **"Hạn chót"**: Sort theo due_date
   - **"Thời gian phát hiện"**: Sort theo detected_at
2. Click nút mũi tên (↑ hoặc ↓) để toggle ascending/descending
3. **Kết quả mong đợi**: Tasks được sắp xếp đúng theo tiêu chí đã chọn

---

### 3.7. Test Xem Chi Tiết Task

**Mục đích**: Kiểm tra nút "Xem" có navigate đúng không

**Các bước**:
1. Tìm một task trong danh sách
2. Click nút **"Xem"** (màu xanh, có icon ExternalLink)
3. **Kết quả mong đợi**: 
   - Navigate đến trang task detail: `/project/{boardId}/{taskId}`
   - Hiển thị đúng task được chọn

---

### 3.8. Test Mark As Resolved

**Mục đích**: Kiểm tra chức năng đánh dấu task đã xử lý

**Các bước**:
1. Tìm một task trong danh sách
2. Click nút **"Đã xử lý"** (màu xanh lá, có icon CheckCircle2)
3. **Kết quả mong đợi**:
   - Toast notification: "Task marked as resolved"
   - Task đó biến mất khỏi danh sách
   - Stats cards cập nhật (giảm số lượng)

**Lưu ý**: Task sẽ không còn hiển thị trong danh sách at-risk tasks nữa

---

### 3.9. Test Real-time Updates (Socket.IO)

**Mục đích**: Kiểm tra real-time alerts hoạt động không

**Các bước**:
1. Mở trang At-Risk Tasks
2. Trong một tab khác hoặc từ backend, trigger một at-risk task mới
   - Có thể tạo task mới thỏa mãn điều kiện at-risk
   - Hoặc chờ scheduler chạy (mỗi 2 giờ)
3. **Kết quả mong đợi**:
   - Toast notification xuất hiện: "New at-risk task detected: {task_title}"
   - Danh sách tasks tự động reload
   - Task mới xuất hiện trong danh sách

**Lưu ý**: Backend scheduler chạy mỗi 2 giờ, hoặc bạn có thể trigger thủ công qua API

---

### 3.10. Test Stats Cards

**Mục đích**: Kiểm tra stats cards hiển thị đúng số liệu

**Các bước**:
1. Xem 4 stats cards ở đầu trang:
   - **Tổng số**: Tổng số at-risk tasks
   - **Nguy cơ cao**: Tasks có risk_score >= 1.5
   - **Nguy cơ trung bình**: Tasks có risk_score từ 0.8 đến 1.5
   - **Nguy cơ thấp**: Tasks có risk_score < 0.8
2. **Kết quả mong đợi**: 
   - Số liệu trong stats cards khớp với số lượng tasks trong danh sách
   - Màu sắc đúng (đỏ cho cao, cam cho trung bình, vàng cho thấp)

---

## 🎯 Bước 4: Tạo Test Data (Nếu chưa có tasks)

Nếu bạn chưa có tasks có nguy cơ trễ hạn, hãy tạo test data:

### 4.1. Tạo Task "Chưa gán & gần hạn" (Score: 0.8)

**Điều kiện**:
- Task không có `assigned_to` (chưa gán)
- `due_date` còn < 3 ngày

**Các bước**:
1. Vào một board bất kỳ
2. Tạo task mới
3. **KHÔNG** gán cho ai (để trống assigned_to)
4. Set `due_date` = ngày mai hoặc ngày kia (còn 1-2 ngày)
5. Save task
6. Quay lại trang At-Risk Tasks và click "Phát hiện lại"

---

### 4.2. Tạo Task "Stuck ở cột" (Score: 0.7)

**Điều kiện**:
- Task ở một cột > 5 ngày không di chuyển

**Các bước**:
1. Tạo task mới hoặc dùng task cũ
2. Đặt task vào một cột (ví dụ: "In Progress")
3. **Đợi 6 ngày** (hoặc thay đổi `created_at`/`updated_at` trong database để giả lập)
4. Quay lại trang At-Risk Tasks và click "Phát hiện lại"

**Lưu ý**: Có thể cần chỉnh sửa database để test nhanh hơn

---

### 4.3. Tạo Task "User có nhiều overdue" (Score: 0.6)

**Điều kiện**:
- User được gán task này đã có > 3 tasks quá hạn khác

**Các bước**:
1. Tạo ít nhất 4 tasks và gán cho cùng một user
2. Set `due_date` của tất cả tasks = ngày hôm qua (đã quá hạn)
3. Đảm bảo tasks chưa ở cột "Done"
4. Quay lại trang At-Risk Tasks và click "Phát hiện lại"

---

### 4.4. Tạo Task "Ước tính cao & ít thời gian" (Score: 0.9)

**Điều kiện**:
- `estimate_hours` > 16 giờ
- Thời gian còn lại < `estimate_hours`

**Các bước**:
1. Tạo task mới
2. Set `estimate_hours` = 20 giờ (hoặc hơn)
3. Set `due_date` = ngày mai (còn khoảng 24 giờ)
4. Quay lại trang At-Risk Tasks và click "Phát hiện lại"

---

## 🐛 Bước 5: Test Error Cases

### 5.1. Test với Board không tồn tại
- Chọn một board ID không hợp lệ
- **Kết quả mong đợi**: Error message hiển thị

### 5.2. Test với Network Error
- Tắt internet
- Thử các actions
- **Kết quả mong đợi**: Error toast hiển thị, không crash

### 5.3. Test với Unauthorized
- Đăng xuất hoặc dùng tài khoản không có quyền
- Truy cập trang
- **Kết quả mong đợi**: Redirect về login hoặc hiển thị error

---

## 📊 Bước 6: Kiểm Tra Console & Network

### 6.1. Mở Developer Tools
- Press `F12` hoặc `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Mở tab **Console** để xem logs
- Mở tab **Network** để xem API calls

### 6.2. Kiểm Tra API Calls

Khi load trang, bạn sẽ thấy các API calls:
- `GET /api/at-risk/board/{boardId}` - Load tasks theo board
- `GET /api/at-risk/user` - Load tasks theo user
- `POST /api/at-risk/detect` - Trigger detection
- `PUT /api/at-risk/resolve/{taskId}` - Mark as resolved

**Kiểm tra**:
- Status code = 200 (success)
- Response có structure đúng
- Không có errors trong console

### 6.3. Kiểm Tra Socket Events

Trong Console, bạn có thể thấy:
- Socket connection established
- Event `at_risk_task_detected` được nhận

---

## ✅ Checklist Test Hoàn Chỉnh

- [ ] Trang load được không có lỗi
- [ ] Load tasks theo board hoạt động
- [ ] Load tasks theo user hoạt động
- [ ] Nút "Phát hiện lại" hoạt động
- [ ] Filter theo mức nguy cơ hoạt động
- [ ] Filter theo rule hoạt động
- [ ] Sort hoạt động
- [ ] Nút "Xem" navigate đúng
- [ ] Nút "Đã xử lý" hoạt động
- [ ] Real-time updates hoạt động
- [ ] Stats cards hiển thị đúng
- [ ] Error handling hoạt động
- [ ] UI responsive (test trên mobile/tablet)
- [ ] Dark mode hoạt động (nếu có)

---

## 🎬 Video Demo Script (Nếu cần quay video)

1. **Giới thiệu** (5 giây)
   - "Hôm nay tôi sẽ demo chức năng At-Risk Detection"

2. **Truy cập trang** (10 giây)
   - Navigate đến trang qua menu
   - Giải thích UI

3. **Load tasks** (15 giây)
   - Chọn board
   - Hiển thị danh sách tasks
   - Giải thích stats cards

4. **Filter & Sort** (20 giây)
   - Demo filter theo mức nguy cơ
   - Demo filter theo rule
   - Demo sort

5. **Actions** (20 giây)
   - Click "Xem" task
   - Click "Đã xử lý"
   - Click "Phát hiện lại"

6. **Real-time** (15 giây)
   - Giải thích về real-time updates
   - Demo (nếu có thể trigger)

7. **Kết luận** (5 giây)
   - Tóm tắt chức năng

---

## 📝 Notes

- Nếu không thấy tasks, đảm bảo backend đã chạy detection job hoặc trigger thủ công
- Backend scheduler chạy mỗi 2 giờ, nên có thể cần đợi hoặc trigger thủ công
- Một số test cases cần thời gian (ví dụ: stuck > 5 ngày), có thể cần chỉnh database để test nhanh
- Đảm bảo có ít nhất một board và tasks trong hệ thống để test

---

## 🆘 Troubleshooting

### Vấn đề: Không thấy tasks
**Giải pháp**:
1. Kiểm tra backend có chạy không
2. Kiểm tra có tasks thỏa mãn điều kiện không
3. Click "Phát hiện lại" để trigger detection
4. Kiểm tra console có errors không

### Vấn đề: API errors
**Giải pháp**:
1. Kiểm tra backend logs
2. Kiểm tra authentication token
3. Kiểm tra permissions của user
4. Kiểm tra API endpoint có đúng không

### Vấn đề: Socket không hoạt động
**Giải pháp**:
1. Kiểm tra socket connection trong console
2. Kiểm tra backend socket config
3. Kiểm tra CORS settings
4. Kiểm tra user đã register với socket chưa

---

Chúc bạn test thành công! 🎉

