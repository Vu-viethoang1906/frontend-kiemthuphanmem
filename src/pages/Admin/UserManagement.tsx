
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchDeletedUsers,
  restoreUser,
} from "../../api/userApi";
import { fetchAllRoles } from "../../api/roleApi";
import { getAllCenters } from "../../api/centerApi";
import { addCenterMember, removeCenterMember, getCenterMembers } from "../../api/centerMemberApi";
import { useModal } from "../../components/ModalProvider";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";

interface Role {
  _id: string;
  name: string;
  description?: string;
}

interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  full_name: string;
  status: string;
  password?: string;
  roles: (string | Role)[];
  created_at?: string;
  updated_at?: string;
  center_id?: string;
  center_name?: string;
  role_in_center?: string;
  centerInfo?: {
    _id: string;
    name: string;
    address?: string;
  };
  centerMember?: {
    _id: string;
    center_id: string;
    user_id: string;
    role_in_center: string;
  };
}

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const modal = useModal();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params
  const [activeTab, setActiveTab] = useState<"active" | "deleted">(
    (searchParams.get('tab') as "active" | "deleted") || "active"
  );
  const [users, setUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [showChangeCenterModal, setShowChangeCenterModal] = useState(false);
  const [selectedUserForCenter, setSelectedUserForCenter] = useState<User | null>(null);
  const [newCenterId, setNewCenterId] = useState("");
  const [newRoleInCenter, setNewRoleInCenter] = useState("Member");
  const [form, setForm] = useState<User>({
    username: "",
    email: "",
    full_name: "",
    status: "active",
    password: "",
    roles: [],
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || "all");
  const [filterRole, setFilterRole] = useState(searchParams.get('role') || "all");
  const [filterCenter, setFilterCenter] = useState(searchParams.get('center') || "all");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [itemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  // Reset to page 1 when search/filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus, filterRole, filterCenter, activeTab]);

  // Update URL when filters change
  const updateURL = () => {
    const params = new URLSearchParams();
    if (activeTab !== 'active') params.set('tab', activeTab);
    if (searchTerm) params.set('search', searchTerm);
    if (filterStatus !== 'all') params.set('status', filterStatus);
    if (filterRole !== 'all') params.set('role', filterRole);
    if (filterCenter !== 'all') params.set('center', filterCenter);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    setSearchParams(params);
  };

  // Sync URL on filter changes
  useEffect(() => {
    updateURL();
  }, [activeTab, searchTerm, filterStatus, filterRole, filterCenter, currentPage]);
  const [actualTotalUsers, setActualTotalUsers] = useState(0);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0);
  const [emailError, setEmailError] = useState("");

  /** =========================
   * LOAD USERS + ROLES
   * ========================= */
  useEffect(() => {
    loadRoles();
    loadCenters();
loadAllUsersCount(); // Load tổng số users thực tế
  }, []);

  const loadCenters = async () => {
    try {
      const response = await getAllCenters();
      if (response.success && response.data) {
        setCenters(response.data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (activeTab === "active") {
      loadUsers();
    } else {
      loadDeletedUsers();
    }
  }, [currentPage, activeTab, searchTerm, filterStatus, filterRole, filterCenter]);

  // Load tổng số users thực tế (tất cả trang)
  const loadAllUsersCount = async () => {
    try {
      // Gọi API với limit lớn để lấy tất cả users
      const res = await fetchAllUsers(1, 1000);
      if (res.success && Array.isArray(res.users)) {
        // ✅ Lọc chỉ đếm active users (không bị xóa)
        const activeUsers = res.users.filter((u: any) => !u.deleted_at);
        
        // ⚠️ DEDUPLICATE trước khi đếm (vì backend có thể trả về duplicate users)
        const userMap = new Map();
        activeUsers.forEach((user: any) => {
          const userId = user._id || user.id;
          const existingUser = userMap.get(userId);
          
          if (!existingUser) {
            userMap.set(userId, user);
          } else {
            const existingDate = new Date(existingUser.updated_at || existingUser.createdAt || 0);
            const currentDate = new Date(user.updated_at || user.createdAt || 0);
            
            if (currentDate > existingDate) {
              userMap.set(userId, user);
            }
          }
        });
        
        const deduplicatedUsers = Array.from(userMap.values());
        const actualCount = deduplicatedUsers.length;
        
        // Đếm số lượng active và inactive users (sau khi deduplicate)
        const activeCount = deduplicatedUsers.filter((u: any) => u.status === 'active').length;
        const inactiveCount = deduplicatedUsers.filter((u: any) => u.status !== 'active').length;
        
        setActualTotalUsers(actualCount);
        setTotalUsers(actualCount);
        setActiveUsersCount(activeCount);
        setInactiveUsersCount(inactiveCount);
        
        // ✅ Tính lại totalPages chính xác
        const calculatedPages = actualCount > 0 ? Math.ceil(actualCount / itemsPerPage) : 1;
        
        
        setTotalPages(calculatedPages);
      }
    } catch (err) {}
  };

  // Load deleted users
  const loadDeletedUsers = async () => {
    try {
      setLoading(true);
      // Gọi API để lấy danh sách người dùng đã xóa
      const res = await fetchDeletedUsers(currentPage, itemsPerPage);

      // ✅ Kiểm tra: Phản hồi có chứa mảng 'users' hay không
      if (res && Array.isArray(res.users)) {
        
        // Lấy danh sách users
        const deletedUsersData = res.users;
        
        // Chuẩn hóa dữ liệu roles
        const normalized = deletedUsersData.map((u: any) => ({
          ...u,
          // Sử dụng trường 'roles' để chuẩn hóa, đảm bảo nó là một mảng
          roles: Array.isArray(u.roles)
            ? u.roles.map((r: any) => ({
                _id: r?._id || "",
                name: r?.name || "", // Lấy tên vai trò từ trường 'name'
              }))
            : // Nếu mảng roles rỗng nhưng có role_name, tạo role giả để hiển thị
              u.role_name ? [{ _id: '', name: u.role_name }] : [],
        }));

        setDeletedUsers(normalized);
        
        // ✅ Truy cập thông tin phân trang từ key 'pagination'
        const pagination = res.pagination || {}; 
        
        // Tính toán tổng số trang
        const totalDeleted = pagination.total || normalized.length;
        const calculatedPages = Math.ceil(totalDeleted / itemsPerPage);
        setTotalPages(calculatedPages);
      } else {
        setDeletedUsers([]);
        setTotalPages(1);
      }
    } catch (err) {
      setDeletedUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Restore user
  const handleRestore = async (userId: string) => {
    const confirmed = await modal.confirm({
      title: "Restore User",
      message: "Are you sure you want to restore this user?",
      variant: "info"
    });
    
    if (!confirmed) return;
    
    try {
      await restoreUser(userId);
      toast.success(
        <div>
          <div className="font-semibold mb-1">User restored successfully!</div>
          <div className="text-sm text-gray-500">The user has been restored and can be used again.</div>
        </div>
      );
      await loadAllUsersCount(); // Cập nhật lại tổng số users
      await loadUsers(); // Reload active users
      loadDeletedUsers();
    } catch (err) {
      toast.error("Unable to restore user. Please try again!");
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      // ⚠️ Fetch TẤT CẢ users (không phân trang) vì backend pagination không đúng khi có duplicate
      const res = await fetchAllUsers(1, 1000);
      

      // Backend trả về: { success: true, users: [...], totalUsers, totalPages, currentPage, limit }
      if (res.success && Array.isArray(res.users)) {
        // Lọc chỉ lấy users KHÔNG bị xóa (deleted_at === null hoặc undefined)
        const activeUsersOnly = res.users.filter((u: any) => !u.deleted_at);
        
        // Chuẩn hóa dữ liệu người dùng
        let normalized = activeUsersOnly.map((u: any) => ({
          ...u,
roles: Array.isArray(u.roles)
            ? u.roles.map((r: any) =>
                typeof r === "string"
                  ? { name: r }
                  : {
                      _id: r?._id || "",
                      name: r?.role_name || r?.name || "",
                    }
              )
            : [],
        }));

        // ✅ Đồng bộ CENTER theo bảng centerMember để tránh hiển thị center cũ (đã xóa)
        try {
          // Bảo đảm có danh sách centers
          let centersList = centers;
          if (!centersList || centersList.length === 0) {
            const response = await getAllCenters();
            if (response?.success && response.data) {
              centersList = response.data;
              setCenters(centersList);
            }
          }

          // Lấy members của tất cả centers và build map userId -> { centerId, centerName }
          const centerMemberArrays = await Promise.all(
            (centersList || []).map(async (c: any) => {
              try {
                const data = await getCenterMembers(c._id);
                const members = data?.data || [];
                return members.map((m: any) => ({
                  userId: m?._id || m?.user_id?._id || m?.user_id?.id || m?.user_id,
                  centerId: c._id,
                  centerName: c.name,
                }));
              } catch {
                return [] as any[];
              }
            })
          );

          const userIdToCenter: Record<string, { centerId: string; centerName: string }> = {};
          centerMemberArrays.flat().forEach((it) => {
            if (it?.userId) {
              userIdToCenter[String(it.userId)] = {
                centerId: it.centerId,
                centerName: it.centerName,
              };
            }
          });

          // Gán lại center cho từng user nếu tìm thấy trong map
          normalized = normalized.map((u: any) => {
            const uid = u._id || u.id;
            const mapped = userIdToCenter[String(uid)];
            if (!mapped) return u;
            return {
              ...u,
              center_id: mapped.centerId,
              centerInfo: { ...(u.centerInfo || {}), _id: mapped.centerId, name: mapped.centerName },
              center_name: mapped.centerName,
            };
          });
        } catch (e) {
          // Nếu lỗi, bỏ qua và dùng dữ liệu cũ
        }

        // ⚠️ DEDUPLICATE: Backend trả về duplicate users khi user có nhiều centers
        // Chỉ lấy bản ghi mới nhất của mỗi user
        const userMap = new Map();
        normalized.forEach((user: any) => {
          const userId = user._id || user.id;
          const existingUser = userMap.get(userId);
          
          if (!existingUser) {
            userMap.set(userId, user);
          } else {
            // So sánh updatedAt, lấy bản ghi mới nhất
            const existingDate = new Date(existingUser.updated_at || existingUser.createdAt || 0);
            const currentDate = new Date(user.updated_at || user.createdAt || 0);
            
            if (currentDate > existingDate) {
              userMap.set(userId, user);
            }
          }
        });

        const deduplicatedUsers = Array.from(userMap.values());

        // ✅ FILTER theo search và filters
        let filteredUsers = [...deduplicatedUsers];
        
        // Filter by search term
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          filteredUsers = filteredUsers.filter((u: any) =>
            u.username?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.full_name?.toLowerCase().includes(query)
          );
        }
        
        // Filter by status
        if (filterStatus !== 'all') {
          filteredUsers = filteredUsers.filter((u: any) => u.status === filterStatus);
        }
        
        // Filter by role
        if (filterRole !== 'all') {
          filteredUsers = filteredUsers.filter((u: any) => {
            const roleNames = u.roles?.map((r: any) => r.name || r) || [];
            return roleNames.includes(filterRole);
          });
        }
        
        // Filter by center
        if (filterCenter !== 'all') {
          filteredUsers = filteredUsers.filter((u: any) => 
            u.center_id === filterCenter || u.centerInfo?._id === filterCenter
          );
        }


        // ✅ PHÂN TRANG Ở FRONTEND (sau khi filter)
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        

        setUsers(paginatedUsers);
        
        // ✅ Sử dụng số lượng SAU KHI filter
        const totalUsersCount = filteredUsers.length;
        
        setTotalUsers(totalUsersCount);
        setActualTotalUsers(deduplicatedUsers.length); // Total without filters
        
        // ✅ Tính toán totalPages chính xác dựa trên filtered users
        const calculatedPages = totalUsersCount > 0 ? Math.ceil(totalUsersCount / itemsPerPage) : 1;
        
        
        setTotalPages(calculatedPages);
      } else {
        setUsers([]);
        setTotalUsers(0);
        setTotalPages(1);
      }
    } catch (err) {
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
const res = await fetchAllRoles();
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setRoles(data);
    } catch (err: any) {
      // Nếu lỗi do thiếu permission, set roles rỗng để trang vẫn hoạt động
      if (err?.response?.status === 403) {
        // no-op
      } else if (err?.response?.status === 500) {
        // no-op
      }
      
      // Set roles rỗng để trang vẫn hoạt động
      setRoles([]);
    }
  };

  /** =========================
   * CRUD HANDLERS
   * ========================= */
  const handleCreate = () => {
    setEditingUser(null);
    setForm({
      username: "",
      email: "",
      full_name: "",
      status: "active",
      password: "",
      roles: [],
      center_id: "",
    });
    setEmailError("");
    setShowModal(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      ...user,
      roles: Array.isArray(user.roles)
        ? user.roles.map((r: any) => (typeof r === "string" ? r : r.name))
        : [],
      center_id: user.center_id || user.centerInfo?._id || "",
      password: "",
    });
    setEmailError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      // ✅ Validate email format - regex chuẩn, dùng được 99% case thực tế
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      if (!form.email || !emailRegex.test(form.email)) {
        toast.error("Invalid email! Email must be in valid format (e.g., user@example.com)");
        return;
      }

    const trimmedPassword = form.password?.trim() || "";

    const payload: any = {
        username: form.username,
        email: form.email,
        full_name: form.full_name,
        status: form.status,
        center_id: form.center_id || null,
        roles: form.roles.map((r: any) => (typeof r === "string" ? r : r.name)),
      };

    if (!editingUser) {
      if (!trimmedPassword) {
        toast.error("Password is required for new users");
        return;
      }
      payload.password = trimmedPassword;
    } else if (trimmedPassword) {
      payload.password = trimmedPassword;
    }

      let userId: string;
      if (editingUser?._id) {
        userId = editingUser._id;
        await updateUser(userId, payload);
        toast.success(
          <div>
            <div className="font-semibold mb-1">User updated successfully!</div>
            <div className="text-sm text-gray-500">User information has been updated.</div>
          </div>
        );
      } else {
        const result = await createUser(payload);
        userId = result._id || result.id || "";
        toast.success(
          <div>
            <div className="font-semibold mb-1">New user created successfully!</div>
            <div className="text-sm text-gray-500">The user has been created and is ready to use.</div>
          </div>
        );
      }

      // ✅ Nếu có center_id, thêm user vào center (qua bảng CenterMember)
      if (form.center_id && userId) {
        try {
          // Xóa khỏi center cũ (nếu có và đang edit)
          if (editingUser?._id && editingUser.center_id && editingUser.center_id !== form.center_id) {
            try {
              await removeCenterMember(editingUser.center_id, userId);
            } catch (err) {
              // Ignore nếu không xóa được
            }
          }
          
          // Thêm vào center mới
          await addCenterMember({
            center_id: form.center_id,
            user_id: userId,
            role_in_center: "Member"
          });
        } catch (centerErr) {
          // Không báo lỗi, vì user đã được tạo/cập nhật thành công
        }
      }

      setShowModal(false);
      await loadAllUsersCount(); // Cập nhật lại tổng số users
      await loadUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unable to save user. Please try again!");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    
    const confirmed = await modal.confirm({
      title: "Delete Confirmation",
      message: "Are you sure you want to delete this user?\nThis action can be reversed from the Deleted Users tab.",
      variant: "error"
    });
    
    if (!confirmed) return;
    
    try {
      await deleteUser(id);
      toast.success(
        <div>
          <div className="font-semibold mb-1">User deleted successfully!</div>
          <div className="text-sm text-gray-500">The user has been deleted and can be restored from the Deleted Users tab.</div>
        </div>
      );
      // Cập nhật lại tổng số users và lấy số mới
      await loadAllUsersCount();
      
      // Tính lại số trang sau khi xóa
      // Lấy lại tổng số users mới từ API
      const res = await fetchAllUsers(1, 1000);
      const activeUsers = res.users?.filter((u: any) => !u.deleted_at) || [];
      const newTotalUsers = activeUsers.length;
      const newTotalPages = newTotalUsers > 0 ? Math.ceil(newTotalUsers / itemsPerPage) : 1;
      
      // Nếu đang ở trang cuối và xóa hết users của trang đó, quay về trang trước
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else {
        await loadUsers();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unable to delete user. Please try again!");
    }
  };

  /** =========================
   * CLIENT-SIDE FILTER (for current page only)
   * ========================= */
  const filteredUsers = users.filter((user) => {
    // Safe search with optional chaining
    const matchSearch =
      searchTerm === "" ||
      (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchStatus =
      filterStatus === "all" || user.status === filterStatus;

    const userRoleNames = Array.isArray(user.roles)
      ? user.roles.map((r: any) =>
          typeof r === "string" ? r : r?.name || ""
        )
      : [];

    const matchRole =
      filterRole === "all" ||
      userRoleNames.some((roleName: string) =>
        (roleName?.toLowerCase() || "").includes(filterRole.toLowerCase())
      );

    const matchCenter =
      filterCenter === "all" ||
      user.center_id === filterCenter ||
      user.centerInfo?._id === filterCenter ||
      user.centerMember?.center_id === filterCenter;

    return matchSearch && matchStatus && matchRole && matchCenter;
  });

  /** =========================
   * PAGINATION
   * ========================= */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    // ✅ Đảm bảo totalPages >= 1
    const validTotalPages = Math.max(1, totalPages);

    if (validTotalPages <= maxVisible) {
      for (let i = 1; i <= validTotalPages; i++) {
        pages.push(i);
      }
    } else {
if (currentPage <= 3) {
        for (let i = 1; i <= Math.min(4, validTotalPages); i++) pages.push(i);
        if (validTotalPages > 4) {
          pages.push('...');
          pages.push(validTotalPages);
        }
      } else if (currentPage >= validTotalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = Math.max(1, validTotalPages - 3); i <= validTotalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= Math.min(currentPage + 1, validTotalPages); i++) pages.push(i);
        pages.push('...');
        pages.push(validTotalPages);
      }
    }

    return pages;
  };
  /** =========================
   * RENDER
   * ========================= */
  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">User Management</h1>
            <p className="text-sm text-gray-500">Manage system users and their roles</p>
          </div>
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors"
            onClick={handleCreate}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Create User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-l-lg font-medium transition-colors ${
              activeTab === "active" 
                ? "bg-blue-600 text-white" 
                : "text-gray-500 hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveTab("active");
              setCurrentPage(1);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Active Users
          </button>
          <button 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-r-lg font-medium transition-colors ${
              activeTab === "deleted" 
                ? "bg-blue-600 text-white" 
                : "text-gray-500 hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveTab("deleted");
              setCurrentPage(1);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Deleted Users
          </button>
        </div>
      </div>

      {/* Filters + Stats Panel */}
      {activeTab === "active" && (
        <>
          {/* Search and Filters */}
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3 w-full">
              {/* Search Bar - kéo giãn toàn bộ phần còn lại */}
              <div className="relative flex-1 min-w-[260px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
                  placeholder="Search by username, email, or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Nhóm 3 bộ lọc cố định chiều rộng, đẩy sát mép phải */}
              <div className="flex items-center gap-3 w-full md:w-fit md:ml-auto">
              {/* Filter Status */}
              <div className="relative w-[180px]">
                <select
                  className="w-full px-4 py-2 pr-8 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Filter Role */}
              <div className="relative w-[180px]">
                <select
                  className="w-full px-4 py-2 pr-8 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer text-sm"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {/* Filter Center */}
              <div className="relative w-[200px]">
                <select
                  className="w-full px-4 py-2 pr-8 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer text-sm"
                  value={filterCenter}
                  onChange={(e) => setFilterCenter(e.target.value)}
                >
                  <option value="all">All Centers</option>
                  {centers.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.name}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - nhỏ hơn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 mb-0.5">Total Users</p>
                <p className="text-xl font-bold text-gray-900">{actualTotalUsers}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 mb-0.5">Active Users</p>
                <p className="text-xl font-bold text-gray-900">{activeUsersCount}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-600 mb-0.5">Inactive Users</p>
                <p className="text-xl font-bold text-gray-900">{inactiveUsersCount}</p>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Users Table (responsive) */}
      <div className="bg-white shadow-sm overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Center</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{activeTab === "deleted" ? "Deleted At" : "Created"}</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="text-gray-500">Loading users...</p>
                  </div>
                </td>
              </tr>
            ) : (activeTab === "active" ? filteredUsers : deletedUsers).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-gray-500">{activeTab === "deleted" ? "No deleted users found" : "No users found"}</p>
                  </div>
                </td>
              </tr>
            ) : (
              (activeTab === "active" ? filteredUsers : deletedUsers).map((user: User) => {
                // Generate avatar color based on name
                const getAvatarColor = (name: string): string => {
                  const colors = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-pink-500", "bg-orange-500", "bg-indigo-500"];
                  let hash = 0;
                  for (let i = 0; i < name.length; i++) {
                    hash = name.charCodeAt(i) + ((hash << 5) - hash);
                  }
                  return colors[Math.abs(hash) % colors.length];
                };
                const avatarColor = getAvatarColor(user.full_name || user.username || "U");
                
                return (
                  <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${avatarColor} text-white flex items-center justify-center text-sm font-semibold`}>
                          {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.full_name || "N/A"}</p>
                          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm text-gray-900 truncate">{user.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {Array.isArray(user.roles) && user.roles.length > 0
                          ? user.roles.map((r: any, idx: number) => {
                              const roleName = typeof r === "string" ? r : r.name || r.role_name || "";
                              let badgeClass = "px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600";
                              
                              if (roleName.toLowerCase() === "admin") {
                                badgeClass = "px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-700";
                              } else if (roleName.toLowerCase() === "system_manager") {
                                badgeClass = "px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700";
                              } else if (roleName.toLowerCase() === "user") {
                                badgeClass = "px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600";
                              }
                              
                              return (
                                <span key={idx} className={badgeClass}>
                                  {roleName}
                                </span>
                              );
                            })
                          : <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400">No role</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {user.center_name || user.centerInfo?.name ? (
                        <div className="flex items-center gap-1 justify-center">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {user.center_name || user.centerInfo?.name}
                          </span>
                          {activeTab === "active" && (
                            <button
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              onClick={() => {
                                setSelectedUserForCenter(user);
                                setNewCenterId(user.center_id || "");
                                setNewRoleInCenter(user.role_in_center || "Member");
                                setShowChangeCenterModal(true);
                              }}
                              title="Change Center"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-center">
                          <span className="text-sm text-gray-400">No center</span>
                          {activeTab === "active" && (
                            <button
                              className="w-5 h-5 rounded bg-green-500 text-white hover:bg-green-600 flex items-center justify-center transition-colors"
                              onClick={() => {
                                setSelectedUserForCenter(user);
                                setNewCenterId("");
                                setNewRoleInCenter("Member");
                                setShowChangeCenterModal(true);
                              }}
                              title="Assign Center"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : user.status === 'inactive'
                            ? 'bg-red-100 text-red-700'
                            : user.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm text-gray-500">
                        {activeTab === "deleted" && (user as any).deleted_at
                          ? new Date((user as any).deleted_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : user.created_at
                          ? new Date(user.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short',
                              day: 'numeric' 
                            })
                          : "-"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 justify-center">
                        {activeTab === "deleted" ? (
                          <button 
                            className="p-2 rounded border-2 border-green-600 text-green-600 hover:bg-green-50 transition-colors" 
                            onClick={() => handleRestore(user._id || user.id || "")} 
                            title="Restore User"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                              <path d="M21 3v5h-5" />
                              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                              <path d="M3 21v-5h5" />
                            </svg>
                          </button>
                        ) : (
                          <>
                            <button 
                              className="p-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors" 
                              onClick={() => handleEdit(user)} 
                              title="Edit"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button 
                              className="p-2 rounded bg-red-50 text-red-700 hover:bg-red-100 transition-colors" 
                              onClick={() => handleDelete(user._id || user.id || "")} 
                              title="Delete"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 pb-6">
          <div className="text-sm text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                  <button
                    key={index}
                    type="button"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={index} className="px-2 text-gray-500">
                    {page}
                  </span>
                )
              ))}
            </div>

            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              type="button"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600">
              <h2 className="text-xl font-bold text-white uppercase">{editingUser ? "Edit User" : "Create User"}</h2>
              <button className="w-8 h-8 text-white hover:bg-blue-700 rounded-md flex items-center justify-center transition-colors" onClick={() => setShowModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">Username *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter username"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  name="um-new-username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">Email *</label>
                <input
                  type="email"
                  className={`w-full px-4 py-2.5 rounded-md border ${
                    emailError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2`}
                  placeholder="Enter email address (e.g., user@gmail.com)"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  name="um-new-email"
                  value={form.email}
                  onChange={(e) => {
                    const email = e.target.value;
                    setForm({ ...form, email });
                    
                    // Validate email real-time - regex chuẩn, dùng được 99% case thực tế
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (email && !emailRegex.test(email)) {
                      setEmailError("Email must be in valid format (e.g., user@example.com)");
                    } else {
                      setEmailError("");
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur - regex chuẩn, dùng được 99% case thực tế
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (form.email && !emailRegex.test(form.email)) {
                      setEmailError("Email must be in valid format (e.g., user@example.com)");
                    }
                  }}
                />
                {emailError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {emailError}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">Full Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  name="um-new-fullname"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">
                  {editingUser ? "New Password" : "Password"} {editingUser ? "" : "*"}
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={editingUser ? "Enter new password (leave blank to keep current)" : "Enter password"}
                  autoComplete="new-password"
                  name="um-new-password"
                  value={form.password || ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                {editingUser && (
                  <p className="mt-2 text-xs text-gray-500">
                    Leave blank to keep the current password.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">Status</label>
                  <select
                    className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">Role</label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                      value={
                        form.roles && form.roles.length > 0
                          ? typeof form.roles[0] === "string"
                            ? form.roles[0]
                            : (form.roles[0] as Role).name
                          : ""
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          roles: [e.target.value],
                        })
                      }
                      disabled={roles.length === 0}
                    >
                      <option value="">{roles.length === 0 ? "No roles available (Permission required)" : "Select role"}</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      onClick={() => {
                        setShowModal(false);
                        navigate('/admin/roleandpermission');
                      }}
                      title="Create new role"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">Center</label>
                <select
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form.center_id || ""}
                  onChange={(e) => setForm({ ...form, center_id: e.target.value })}
                >
                  <option value="">-- Select Center (Optional) --</option>
                  {centers.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button 
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-blue-600 hover:bg-gray-50 transition-colors" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-2" 
                onClick={handleSave}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {editingUser ? "Save changes" : "Create user"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Center Modal */}
      {showChangeCenterModal && selectedUserForCenter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4" onClick={() => setShowChangeCenterModal(false)}>
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 bg-blue-600">
              <h2 className="text-xl font-bold text-white uppercase">Change Center</h2>
              <button className="w-8 h-8 text-white hover:bg-blue-700 rounded-md flex items-center justify-center transition-colors" onClick={() => setShowChangeCenterModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">Current Center</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 bg-gray-50 cursor-not-allowed"
                  value={selectedUserForCenter.center_name || selectedUserForCenter.centerInfo?.name || "No center"}
                  disabled
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">New Center *</label>
                <select
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newCenterId}
                  onChange={(e) => setNewCenterId(e.target.value)}
                >
                  <option value="">-- Select Center --</option>
                  {centers.map((center) => (
                    <option key={center._id} value={center._id}>
                      {center.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase">Role in Center</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Member, Manager, Admin"
                  value={newRoleInCenter}
                  onChange={(e) => setNewRoleInCenter(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button 
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-blue-600 hover:bg-gray-50 transition-colors" 
                onClick={() => setShowChangeCenterModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-2" 
                onClick={async () => {
                  if (!newCenterId) {
                    toast.error("Please select a center");
                    return;
                  }

                  try {
                    setLoading(true);
                    const userId = selectedUserForCenter._id || selectedUserForCenter.id || "";
                    const oldCenterId = selectedUserForCenter.center_id || selectedUserForCenter.centerInfo?._id;

                    // BƯỚC 1: XÓA HOÀN TOÀN khỏi center cũ (nếu có và khác center mới)
                    if (oldCenterId && oldCenterId !== newCenterId) {
                      try {
                        await removeCenterMember(oldCenterId, userId);
                      } catch (err: any) {
                        // Tiếp tục vì có thể user không có trong center cũ
                      }
                    }

                    // BƯỚC 2: Thêm vào center mới (hoặc bỏ qua nếu đã có)
                    try {
                      await addCenterMember({
                        center_id: newCenterId,
                        user_id: userId,
                        role_in_center: newRoleInCenter || "Member"
                      });
                    } catch (addErr: any) {
                      // Nếu lỗi là "Thành viên đã tồn tại trong trung tâm", đó là OK
                      if (addErr.response?.data?.message?.includes("đã tồn tại") || 
                          addErr.response?.data?.message?.includes("already exists")) {
                        // Không throw error, coi như thành công
                      } else {
                        throw addErr;
                      }
                    }

                    toast.success(
                      <div>
                        <div className="font-semibold mb-1">
                          {oldCenterId ? "Center updated successfully!" : "Center assigned successfully!"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {oldCenterId ? "Center has been updated." : "Center has been assigned to the user."}
                        </div>
                      </div>
                    );

                    // ✅ Cập nhật ngay UI local để đồng bộ cho các user có center cũ đã bị xóa
                    setUsers((prev) =>
                      prev.map((u) => {
                        const same = (u._id || (u as any).id) === userId;
                        if (!same) return u;
                        return {
                          ...u,
                          center_id: newCenterId,
                          centerInfo: { ...(u as any).centerInfo, _id: newCenterId, name: centers.find(c => c._id === newCenterId)?.name || (u as any).centerInfo?.name },
                          center_name: centers.find(c => c._id === newCenterId)?.name || (u as any).center_name,
                          role_in_center: newRoleInCenter || "Member",
                        } as any;
                      })
                    );

                    setShowChangeCenterModal(false);
                    setSelectedUserForCenter(null);
                    
                    // BƯỚC 3: Reload users để cập nhật UI - đợi một chút để backend xử lý xong
                    setTimeout(async () => {
                      await loadUsers();
                      await loadAllUsersCount();
                    }, 500);
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || error.message || "Unable to change center. Please try again!");
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Change Center
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
