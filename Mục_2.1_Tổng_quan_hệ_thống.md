# MỤC 2.1: TỔNG QUAN HỆ THỐNG

## 2.1.1. Mục tiêu của phần mềm

Hệ thống quản lý dự án và công việc KEN được xây dựng với các mục tiêu chính sau:

### 2.1.1.1. Mục tiêu chính
- **Quản lý dự án và công việc hiệu quả**: Cung cấp nền tảng quản lý dự án theo mô hình Kanban/Scrum, cho phép người dùng tạo và quản lý các bảng dự án (Board), tổ chức công việc theo cột (Column) và làn (Swimlane), theo dõi tiến độ công việc một cách trực quan và linh hoạt.

- **Tối ưu hóa quy trình làm việc**: Hỗ trợ quản lý nhiệm vụ (Task) với đầy đủ thông tin như mô tả, mức độ ưu tiên, ngày bắt đầu, ngày hết hạn, ước tính giờ làm việc, người được giao việc, và đính kèm file. Tích hợp tính năng kéo thả (Drag & Drop) để di chuyển công việc giữa các cột một cách dễ dàng.

- **Phân tích và báo cáo thông minh**: Cung cấp hệ thống phân tích dữ liệu toàn diện bao gồm Throughput (Thông lượng), Completion (Tỷ lệ hoàn thành), Cycle Time (Thời gian chu kỳ), Board Health Score (Điểm sức khỏe dự án), At-Risk Task Detection (Phát hiện công việc có rủi ro), và Centers Performance (Hiệu suất trung tâm). Hỗ trợ xuất báo cáo theo lịch trình và báo cáo tùy chỉnh.

### 2.1.1.2. Mục tiêu giáo dục và động lực
- **Gamification và động lực học tập**: Tích hợp hệ thống gamification thích ứng (Adaptive Gamification) sử dụng AI để phân tích hành vi người dùng và điều chỉnh phần thưởng (điểm, huy hiệu) phù hợp với từng cá nhân. Hệ thống theo dõi điểm số, huy hiệu, và đề xuất lộ trình học tập (Learning Path) dựa trên kỹ năng và thành tích.

- **Hỗ trợ môi trường giáo dục**: Quản lý nhóm (Group) và trung tâm (Center), theo dõi hiệu suất của giáo viên (Teacher Throughput, Teacher Estimations), và cung cấp công cụ kiểm soát chất lượng công việc (Work Control, Work Forecast).

### 2.1.1.3. Mục tiêu quản trị và bảo mật
- **Quản lý người dùng và phân quyền linh hoạt**: Hệ thống quản lý người dùng (User Management) với phân quyền chi tiết dựa trên vai trò (Role) và quyền hạn (Permission). Hỗ trợ đăng nhập đơn giản và đăng nhập SSO (Single Sign-On) thông qua Keycloak.

- **Tích hợp và mở rộng**: Hỗ trợ tích hợp với Google Calendar để đồng bộ lịch, tích hợp Slack để gửi thông báo, và cung cấp API Key Management để tích hợp với các hệ thống bên ngoài. Tích hợp AI (Google Gemini, Groq) để hỗ trợ phân tích và đề xuất thông minh.

### 2.1.1.4. Mục tiêu trải nghiệm người dùng
- **Giao diện hiện đại và thân thiện**: Xây dựng giao diện người dùng hiện đại với React, hỗ trợ chế độ sáng/tối (Dark Mode), responsive design, và trải nghiệm người dùng mượt mà với các hiệu ứng animation.

- **Thông báo và cộng tác real-time**: Hệ thống thông báo real-time thông qua Socket.IO, cho phép người dùng nhận thông báo ngay lập tức về các thay đổi trong dự án, bình luận, và cập nhật công việc. Hỗ trợ bình luận (Comment) và đính kèm file cho từng công việc.

---

## 2.1.2. Phạm vi của phần mềm

### 2.1.2.1. Phạm vi chức năng

#### a) Quản lý dự án và công việc
- **Quản lý Board (Bảng dự án)**: Tạo, chỉnh sửa, xóa, sao chép bảng dự án. Quản lý thành viên bảng, cấu hình cài đặt bảng, và chuyển đổi bảng thành template.
- **Quản lý Task (Công việc)**: Tạo, chỉnh sửa, xóa, di chuyển công việc giữa các cột và làn. Gán người thực hiện, thiết lập mức độ ưu tiên, ngày tháng, ước tính thời gian. Đính kèm file, thêm bình luận, gắn thẻ (Tag).
- **Quản lý Template**: Tạo và quản lý template bảng dự án với các cột và làn được định nghĩa sẵn, cho phép tạo nhanh các dự án mới từ template.
- **Quản lý Column và Swimlane**: Tùy chỉnh cấu trúc bảng với các cột (ví dụ: To Do, In Progress, Done) và các làn (theo nhóm, theo người, v.v.).

#### b) Phân tích và báo cáo
- **Dashboard và Analytics**: Dashboard tổng quan với các chỉ số hiệu suất, biểu đồ thống kê. Phân tích Throughput, Completion Rate, Cycle Time, Board Health Score.
- **Báo cáo**: Tạo và xem báo cáo hoạt động (Activity Logs), báo cáo theo người dùng, báo cáo theo công việc. Lên lịch gửi báo cáo tự động qua email.
- **Phát hiện rủi ro**: Hệ thống tự động phát hiện các công việc có nguy cơ trễ hạn (At-Risk Tasks) và cảnh báo người dùng.
- **Work Control và Forecast**: Dự báo khối lượng công việc, phân tích công việc quá hạn, chỉ số cộng tác (Collaboration Index), và các chỉ số chất lượng công việc.

#### c) Quản lý người dùng và tổ chức
- **Quản lý người dùng**: Tạo, chỉnh sửa, vô hiệu hóa tài khoản người dùng. Quản lý thông tin cá nhân, avatar, cài đặt tài khoản.
- **Quản lý vai trò và quyền**: Tạo và quản lý các vai trò (Role), gán quyền hạn (Permission) cho từng vai trò, gán vai trò cho người dùng. Hệ thống phân quyền chi tiết đến từng trang và chức năng.
- **Quản lý nhóm (Group)**: Tạo và quản lý các nhóm, thêm/xóa thành viên nhóm.
- **Quản lý trung tâm (Center)**: Quản lý các trung tâm, thành viên trung tâm, và theo dõi hiệu suất trung tâm.

#### d) Gamification và học tập
- **Hệ thống điểm và huy hiệu**: Người dùng nhận điểm khi hoàn thành công việc, đạt các mốc thành tích. Quản lý huy hiệu (Badge) và hiển thị bảng xếp hạng.
- **Adaptive Gamification**: Hệ thống AI phân tích hành vi người dùng và điều chỉnh phần thưởng phù hợp (cạnh tranh/cộng tác, ngắn hạn/dài hạn).
- **Learning Path**: Đề xuất lộ trình học tập dựa trên kỹ năng và thành tích của người dùng. Quản lý tài nguyên học tập (Learning Resources).

#### e) Tích hợp và cài đặt
- **Tích hợp Google Calendar**: Đồng bộ lịch công việc với Google Calendar, xem lịch làm việc trực tiếp trong hệ thống.
- **Tích hợp Slack**: Gửi thông báo và cập nhật công việc đến kênh Slack.
- **Quản lý API Key**: Tạo và quản lý API Key để tích hợp với các hệ thống bên ngoài.
- **Cài đặt hệ thống**: Quản lý logo, theme, sidebar menu, cài đặt gamification, cài đặt thông báo, và các tùy chọn hệ thống khác.

#### f) Thông báo và cộng tác
- **Hệ thống thông báo**: Thông báo real-time về các sự kiện trong hệ thống (công việc mới, bình luận, thay đổi trạng thái, v.v.). Quản lý tùy chọn thông báo (Notification Preferences).
- **Bình luận và đính kèm**: Thêm bình luận cho công việc, đính kèm file, xem lịch sử thay đổi công việc.

### 2.1.2.2. Phạm vi kỹ thuật
- **Frontend**: Ứng dụng web được xây dựng bằng React với TypeScript, sử dụng React Router cho điều hướng, Socket.IO Client cho real-time communication, và các thư viện UI hiện đại.
- **Backend**: API RESTful được xây dựng bằng Node.js với Express, sử dụng MongoDB làm cơ sở dữ liệu, Socket.IO cho real-time, và tích hợp Keycloak cho xác thực SSO.
- **Xác thực và bảo mật**: Hỗ trợ đăng nhập thông thường và SSO qua Keycloak. Hệ thống phân quyền dựa trên Role-Based Access Control (RBAC).
- **Triển khai**: Hỗ trợ triển khai bằng Docker, có cấu hình cho môi trường development, test, và production.

### 2.1.2.3. Phạm vi ngoài hệ thống (Không bao gồm)
- Hệ thống không bao gồm quản lý thanh toán hoặc tính năng thương mại điện tử.
- Hệ thống không bao gồm quản lý tài chính hoặc kế toán.
- Hệ thống không bao gồm quản lý nhân sự phức tạp (lương, bảo hiểm, v.v.).
- Hệ thống không bao gồm ứng dụng mobile native (chỉ hỗ trợ web responsive).

---

## 2.1.3. Danh sách các tác nhân sử dụng hệ thống

### 2.1.3.1. Admin (Quản trị viên hệ thống)
**Mô tả**: Người dùng có quyền cao nhất trong hệ thống, quản lý toàn bộ các chức năng và cài đặt hệ thống.

**Quyền hạn và trách nhiệm**:
- Quản lý người dùng: Tạo, chỉnh sửa, xóa, vô hiệu hóa tài khoản người dùng
- Quản lý vai trò và quyền: Tạo, chỉnh sửa vai trò, gán quyền hạn cho vai trò
- Quản lý trung tâm (Center): Tạo, chỉnh sửa, xóa trung tâm, quản lý thành viên trung tâm
- Quản lý template: Tạo, chỉnh sửa, xóa template bảng dự án
- Xem tất cả các bảng dự án và công việc trong hệ thống
- Truy cập đầy đủ các tính năng phân tích và báo cáo
- Quản lý điểm số người dùng (User Points Management)
- Cấu hình hệ thống: Logo, theme, sidebar, gamification settings, API keys
- Xem và quản lý tất cả các báo cáo và nhật ký hoạt động

### 2.1.3.2. System Manager (Quản lý hệ thống)
**Mô tả**: Người dùng có quyền quản lý cao, tương tự Admin nhưng có thể bị giới hạn một số chức năng quản trị hệ thống cốt lõi.

**Quyền hạn và trách nhiệm**:
- Xem và quản lý các bảng dự án và công việc
- Truy cập đầy đủ các tính năng phân tích (Analytics): Throughput, Completion, Cycle Time, Board Health Score, At-Risk Tasks, Centers Performance
- Quản lý Work Control và Work Forecast
- Quản lý điểm số người dùng (User Points Management)
- Xem báo cáo và nhật ký hoạt động
- Quản lý nhóm (Group) và trung tâm (Center) (nếu được cấp quyền)
- Có thể có quyền quản lý người dùng và vai trò (tùy cấu hình)

### 2.1.3.3. Teacher (Giáo viên/Giảng viên)
**Mô tả**: Người dùng có vai trò giáo viên, quản lý và theo dõi công việc của học viên/sinh viên.

**Quyền hạn và trách nhiệm**:
- Tạo và quản lý các bảng dự án (Board) cho lớp học/nhóm học viên
- Tạo, chỉnh sửa, gán công việc (Task) cho học viên
- Xem và đánh giá công việc của học viên
- Xem phân tích hiệu suất: Teacher Throughput, Teacher Estimations
- Quản lý nhóm (Group) và thành viên nhóm
- Xem báo cáo và phân tích liên quan đến các dự án được quản lý
- Sử dụng template để tạo nhanh các dự án mới
- Thêm bình luận và phản hồi cho công việc của học viên

### 2.1.3.4. Student (Học viên/Sinh viên)
**Mô tả**: Người dùng là học viên/sinh viên, thực hiện các công việc được giao và theo dõi tiến độ học tập.

**Quyền hạn và trách nhiệm**:
- Xem các bảng dự án (Board) mà mình là thành viên
- Xem và cập nhật các công việc (Task) được giao cho mình
- Cập nhật trạng thái công việc, thêm bình luận, đính kèm file
- Xem điểm số, huy hiệu, và bảng xếp hạng (Gamification)
- Xem lộ trình học tập (Learning Path) được đề xuất
- Xem thông báo và cập nhật real-time
- Xem báo cáo cá nhân và tiến độ học tập
- Sử dụng các tính năng cộng tác: bình luận, thảo luận

### 2.1.3.5. Board Owner (Chủ sở hữu bảng dự án)
**Mô tả**: Người dùng tạo ra bảng dự án hoặc được gán quyền sở hữu bảng, có quyền quản lý đầy đủ bảng đó.

**Quyền hạn và trách nhiệm**:
- Quản lý cài đặt bảng dự án (Board Settings)
- Thêm/xóa thành viên bảng (Board Members)
- Tùy chỉnh cấu trúc bảng: cột (Column), làn (Swimlane)
- Tạo, chỉnh sửa, xóa công việc trong bảng
- Xem phân tích và báo cáo của bảng
- Chuyển đổi bảng thành template (nếu có quyền)
- Xóa bảng dự án

### 2.1.3.6. Board Member (Thành viên bảng dự án)
**Mô tả**: Người dùng được mời tham gia vào bảng dự án với quyền thành viên.

**Quyền hạn và trách nhiệm**:
- Xem bảng dự án và các công việc trong bảng
- Tạo và chỉnh sửa công việc (tùy theo quyền được cấp)
- Cập nhật trạng thái công việc được giao
- Thêm bình luận và đính kèm file cho công việc
- Xem phân tích và báo cáo của bảng (nếu được cấp quyền)
- Nhận thông báo về các thay đổi trong bảng

### 2.1.3.7. Group Leader (Trưởng nhóm)
**Mô tả**: Người dùng được gán làm trưởng nhóm, quản lý nhóm và các thành viên trong nhóm.

**Quyền hạn và trách nhiệm**:
- Quản lý thành viên nhóm: thêm, xóa thành viên
- Xem và quản lý các bảng dự án của nhóm
- Phân công công việc cho thành viên nhóm
- Xem báo cáo và phân tích hiệu suất nhóm
- Điều phối công việc và cộng tác trong nhóm

### 2.1.3.8. Center Admin (Quản trị viên trung tâm)
**Mô tả**: Người dùng quản lý một trung tâm cụ thể, có quyền quản lý các hoạt động trong trung tâm đó.

**Quyền hạn và trách nhiệm**:
- Quản lý thành viên trung tâm: thêm, xóa thành viên
- Xem và quản lý các bảng dự án trong trung tâm
- Xem phân tích hiệu suất trung tâm (Centers Performance)
- Tạo báo cáo và phân tích cho trung tâm
- Quản lý nhóm và dự án trong phạm vi trung tâm

### 2.1.3.9. Viewer (Người xem)
**Mô tả**: Người dùng chỉ có quyền xem, không thể chỉnh sửa hoặc tạo mới.

**Quyền hạn và trách nhiệm**:
- Xem các bảng dự án và công việc được chia sẻ
- Xem báo cáo và phân tích (chỉ đọc)
- Xem thông tin công khai: điểm số, bảng xếp hạng (nếu được phép)
- Không thể tạo, chỉnh sửa, hoặc xóa bất kỳ nội dung nào

### 2.1.3.10. Guest (Khách)
**Mô tả**: Người dùng chưa đăng nhập hoặc có quyền hạn rất hạn chế.

**Quyền hạn và trách nhiệm**:
- Xem trang giới thiệu (Introduction) và thông tin công khai
- Đăng nhập vào hệ thống
- Không thể truy cập các chức năng khác cho đến khi được cấp quyền

---

**Lưu ý**: Các vai trò và quyền hạn có thể được tùy chỉnh linh hoạt thông qua hệ thống quản lý vai trò và quyền (Role and Permission Management). Một người dùng có thể có nhiều vai trò khác nhau tùy theo ngữ cảnh (ví dụ: vừa là Teacher, vừa là Board Owner của một số bảng dự án).




