import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useModal } from "../../components/ModalProvider";
import LoadingScreen from "../../components/LoadingScreen";
import {
  getAllUserPoints,
  getUserPointsByUser,
  getUserPointByUserAndCenter,
  createUserPoint,
  updateUserPoint,
  deleteUserPoint,
  UserPoint,
  CreateUserPointData,
  UpdateUserPointData,
} from "../../api/userPointApi";
import { getAllCenters } from "../../api/centerApi";
import { searchUsers, fetchAllUsers } from "../../api/userApi";
import {
  Trophy,
  AlertTriangle,
  Info,
  PlusCircle,
  Pencil,
  Trash2,
  Award,
  Gem,
  ToggleRight,
  CheckCircle,
  Check,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

const UserPointsManagement: React.FC = () => {
  const { show, confirm } = useModal();
  const [userPoints, setUserPoints] = useState<UserPoint[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAddPointsModal, setShowAddPointsModal] = useState(false);
  const [editingUserPoint, setEditingUserPoint] = useState<UserPoint | null>(null);
  const [selectedUserPoint, setSelectedUserPoint] = useState<UserPoint | null>(null);
  
  // Filters
  const [selectedCenter, setSelectedCenter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  // Level filter removed - not in backend data
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Form states
  const [formData, setFormData] = useState<CreateUserPointData>({
    user_id: "",
    center_id: "",
    points: 0,
    total_points: 0,
    status: "active",
  });

  // Quick action states
  const [quickPoints, setQuickPoints] = useState<number>(0);

  // User search states
  const [userSearch, setUserSearch] = useState<string>("");
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [centerSearch, setCenterSearch] = useState<string>("");
  const [showCenterDropdown, setShowCenterDropdown] = useState<boolean>(false);

  // Check admin
  const rolesRaw = localStorage.getItem("roles");
  let isAdmin = false;
  try {
    const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
    isAdmin = roles.some((r: string) => ["admin", "System_Manager"].includes(r));
  } catch {
    isAdmin = false;
  }

  useEffect(() => {
    fetchUserPoints();
    fetchCenters();
    fetchUsers();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-points-autocomplete-wrapper')) {
        setShowUserDropdown(false);
        setShowCenterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Bottom-left toast helper
  const showToast = (
    variant: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => {
    const color =
      variant === 'success' ? 'bg-teal-500' : variant === 'error' ? 'bg-rose-500' : 'bg-blue-500';
    const icon =
      variant === 'success' ? (
        <Check className="w-5 h-5 text-white" />
      ) : variant === 'error' ? (
        <AlertTriangle className="w-5 h-5 text-white" />
      ) : (
        <Info className="w-5 h-5 text-white" />
      );

    toast.custom(
      () => (
        <div className={`pointer-events-auto mr-[-32px] flex w-[340px] items-center gap-2 bg-white p-3 pr-16 shadow-lg ring-1 ring-gray-100`}> 
          <div className={`shrink-0 ${color} p-2 shadow-sm`}>{icon}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            {message && <div className="mt-0.5 text-xs text-gray-600">{message}</div>}
          </div>
        </div>
      ),
      { position: 'bottom-right', duration: 4000 }
    );
  };

  const fetchUserPoints = async () => {
    try {
      setLoading(true);
      
      // Nếu là admin, lấy tất cả. Nếu không, chỉ hiển thị thông báo
      if (!isAdmin) {
        toast.error("You do not have access. Only admins can view this page.");
        setLoading(false);
        return;
      }
      
      const response = await getAllUserPoints();
      
      // Backend trả về: { success: true, count: X, data: [...] }
      let points = [];
      if (response.success && response.data) {
        points = response.data;
      } else if (Array.isArray(response.data)) {
        points = response.data;
      } else if (Array.isArray(response)) {
        points = response;
      }
      
      // Map populated fields - backend populate trả về object trong user_id và center_id
      const mappedPoints = points.map((up: any) => {
        // Lưu ID gốc trước khi map
        const userId = (typeof up.user_id === 'object' && up.user_id !== null) ? up.user_id._id : up.user_id;
        const centerId = (typeof up.center_id === 'object' && up.center_id !== null) ? up.center_id._id : up.center_id;
        
        // Lấy populated data
        const user = (typeof up.user_id === 'object' && up.user_id !== null) ? up.user_id : up.user;
        const center = (typeof up.center_id === 'object' && up.center_id !== null) ? up.center_id : up.center;
        
        return {
          ...up,
          user_id: userId,      // Giữ ID string để filter
          center_id: centerId,  // Giữ ID string để filter
          user,                 // Populated data để hiển thị
          center,               // Populated data để hiển thị
          level: up.level || 1, // Default level = 1 nếu undefined
          points: up.points || 0,
          total_points: up.total_points || 0,
          status: up.status || 'active',
        };
      });
      
      setUserPoints(mappedPoints);
    } catch (error: any) {
      // Nếu lỗi 403 (Forbidden), user không có quyền
      if (error.response?.status === 403) {
        toast.error("You do not have access. Only admins can view this page.");
      } else {
        toast.error("Failed to load user points list");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await getAllCenters();
      if (response.success && response.data) {
        setCenters(response.data);
      }
    } catch (error) {
      console.error("Failed to load centers:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      let userList = [];
      
      // Dùng fetchAllUsers vì user là admin (đã check isAdmin ở trên)
      try {
        const response = await fetchAllUsers(1, 1000);
        
        // Backend trả về { success: true, data: [...] } hoặc { users: [...] }
        if (response.success && Array.isArray(response.data)) {
          userList = response.data;
        } else if (Array.isArray(response.users)) {
          userList = response.users;
        } else if (Array.isArray(response.data)) {
          userList = response.data;
        } else if (Array.isArray(response)) {
          userList = response;
        }
        setUsers(userList);
      } catch (error: any) {
        console.error("Failed to load users:", error);
        // Nếu lỗi 403, có thể không phải admin
        if (error.response?.status === 403) {
        }
      }
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  // Handle form input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for create
  const handleCreate = () => {
    setEditingUserPoint(null);
    setFormData({
      user_id: "",
      center_id: "",
      points: 0,
      total_points: 0,
      level: 1,
      status: "active",
    });
    setUserSearch("");
    setCenterSearch("");
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (userPoint: UserPoint) => {
    setEditingUserPoint(userPoint);
    setFormData({
      user_id: userPoint.user_id,
      center_id: userPoint.center_id,
      points: userPoint.points,
      total_points: userPoint.total_points,
      level: userPoint.level,
      status: userPoint.status,
    });
    // Set search text for editing
    const user = users.find(u => u._id === userPoint.user_id);
    const center = centers.find(c => c._id === userPoint.center_id);
    setUserSearch(user ? `${user.full_name || user.username} (${user.email})` : "");
    setCenterSearch(center ? center.name : "");
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.center_id) {
      toast.error("User and Center are required");
      return;
    }

    // Validate points không được âm
    if (formData.points !== undefined && formData.points < 0) {
      toast.error("Points cannot be negative");
      return;
    }

    if (formData.total_points !== undefined && formData.total_points < 0) {
      toast.error("Total points cannot be negative");
      return;
    }

    // Level validation removed

    try {
      setLoading(true);
      if (editingUserPoint) {
        await updateUserPoint(editingUserPoint._id, formData as UpdateUserPointData);
        showToast('success', 'Successfully updated!', 'User point updated successfully.');
      } else {
        await createUserPoint(formData);
        showToast('success', 'Successfully created!', 'User point created successfully.');
      }
      setShowModal(false);
      fetchUserPoints();
    } catch (error: any) {
      showToast('error', 'Operation failed', error.response?.data?.message || 'An error occurred.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Delete user point
  const handleDelete = async (userPoint: UserPoint) => {
    const confirmed = await confirm({
      title: "Confirm Delete",
      message: `Are you sure you want to delete user point for ${userPoint.user?.full_name || userPoint.user?.username || "this user"}?`
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteUserPoint(userPoint._id);
      showToast('success', 'Successfully deleted!', 'User point deleted successfully.');
      fetchUserPoints();
    } catch (error: any) {
      showToast('error', 'Delete failed', error.response?.data?.message || 'Failed to delete user point');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Quick actions
  const handleAddPoints = async () => {
    if (!selectedUserPoint) {
      toast.error("No user point selected");
      return;
    }

    if (quickPoints === 0) {
      toast.error("Please enter a valid points amount");
      return;
    }

    if (quickPoints < 0) {
      toast.error("Points cannot be negative");
      return;
    }

    try {
      setLoading(true);
      const newPoints = (selectedUserPoint.points || 0) + quickPoints;
      const newTotalPoints = (selectedUserPoint.total_points || 0) + quickPoints;
      
      // Cập nhật cả points và total_points
      await updateUserPoint(selectedUserPoint._id, {
        points: newPoints,
        total_points: newTotalPoints
      });
      
      showToast('success', 'Points added!', `Added ${quickPoints} points successfully.`);
      setShowAddPointsModal(false);
      setQuickPoints(0);
      fetchUserPoints();
    } catch (error: any) {
      showToast('error', 'Add points failed', error.response?.data?.message || 'Failed to add points');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  // Filter user points
  const filteredUserPoints = userPoints.filter((up) => {
    // Filter by center (center_id đã là string sau khi map)
    if (selectedCenter !== "all" && up.center_id !== selectedCenter) {
      return false;
    }

    // Level filter removed

    // Filter by status
    if (statusFilter !== "all" && up.status !== statusFilter) {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      const userName = up.user?.username || up.user?.full_name || "";
      const centerName = up.center?.name || "";
      const searchLower = searchTerm.toLowerCase();
      return (
        userName.toLowerCase().includes(searchLower) ||
        centerName.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Get status badge Tailwind CSS classes
  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 font-semibold px-3 py-1 uppercase text-xs";
      case "inactive":
        return "bg-slate-100 text-slate-600 font-semibold px-3 py-1 uppercase text-xs";
      case "suspended":
        return "bg-rose-100 text-rose-700 font-semibold px-3 py-1 uppercase text-xs";
      default:
        return "bg-blue-50 text-blue-700 font-semibold px-3 py-1 uppercase text-xs";
    }
  };

  // Sort by points (leaderboard)
  const sortedByPoints = [...filteredUserPoints].sort((a, b) => b.points - a.points);

  // Pagination logic
  const totalPages = Math.ceil(sortedByPoints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUserPoints = sortedByPoints.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCenter, searchTerm, statusFilter]);

  // Nếu không phải admin, hiển thị thông báo
  if (!isAdmin) {
    return (
      <div className="w-full px-6 py-6 bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <div className="border border-amber-300 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-amber-900">Access Denied</h4>
                <p className="mt-1 text-sm text-amber-800">
                  You do not have access to this page. Only <strong>Admins</strong> or <strong>System Managers</strong> can manage user points.
                </p>
                <div className="mt-3 h-px bg-amber-200" />
                <p className="mt-3 text-sm text-amber-800">Please contact an administrator if you need access.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-blue-200">
        <h1 className="text-3xl font-bold text-gray-900 tracking-wide flex items-center gap-3">
          <Trophy className="w-7 h-7 text-blue-600" />
          User Points & Achievements
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white border border-blue-200 p-6 mb-6 shadow-sm">
        <div className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-4">FILTERS</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Center</label>
            <select
              className="px-3 py-2 border border-blue-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
            >
              <option value="all">All Centers</option>
              {centers.map((center) => (
                <option key={center._id} value={center._id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Status</label>
            <select
              className="px-3 py-2 border border-blue-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Search</label>
            <input
              type="text"
              className="px-3 py-2 border border-blue-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="Search by user or center..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="text-right text-sm text-blue-700 pt-4 border-t border-blue-100">
          Total: <strong className="text-blue-900">{filteredUserPoints.length}</strong> user points
        </div>
      </div>

      {/* Leaderboard Table */}
      {loading && !showModal ? (
        <LoadingScreen message="Loading user points..." minimal />
      ) : filteredUserPoints.length === 0 ? (
        <div className="bg-white border border-gray-300">
          <div className="py-12 text-center text-gray-600">
            <Info className="w-10 h-10 mx-auto mb-3" />
            No user points found
          </div>
        </div>
      ) : (
        <div className="bg-white border border-blue-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-blue-200">
            <thead>
              <tr className="bg-blue-50 text-blue-700">
                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-14">#</th>
                <th className="p-4 text-left text-xs font-bold uppercase tracking-wider border-r border-blue-200">USER</th>
                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200">CENTER</th>
                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-28">POINTS</th>
                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-28">TOTAL</th>
                <th className="p-4 text-center text-xs font-bold uppercase tracking-wider border-r border-blue-200 w-24">STATUS</th>
                {isAdmin && <th className="p-4 text-center text-xs font-bold uppercase tracking-wider w-32">ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedUserPoints.map((up, index) => (
                <tr key={up._id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                  <td className="p-4 font-bold text-gray-600 text-center">
                    {startIndex + index + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border-2 border-blue-400 bg-white text-black font-bold text-base flex items-center justify-center">
                        {up.user ? (up.user.full_name?.[0] || up.user.username?.[0] || "?").toUpperCase() : "?"}
                      </div>
                      <div className="flex flex-col gap-1">
                        {up.user ? (
                          <>
                            <div className="font-semibold text-black">
                              {up.user.full_name || up.user.username}
                            </div>
                            <div className="text-xs text-gray-600">
                              {up.user.email}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-400">
                            User deleted
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-center">{up.center?.name || "-"}</td>
                  <td className="p-4 text-center">
                    <div className="text-xl font-bold text-black">{up.points}</div>
                  </td>
                  <td className="p-4 text-gray-600 text-center">{up.total_points || 0}</td>
                  <td className="p-4 text-center">
                    <span className={getStatusBadgeClasses(up.status)}>
                      {up.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          className="bg-white border border-blue-600 text-blue-600 px-3 py-1.5 font-semibold text-xs uppercase tracking-wide transition-all duration-150 flex items-center gap-1.5 hover:bg-blue-600 hover:text-white"
                          onClick={() => {
                            setSelectedUserPoint(up);
                            setShowAddPointsModal(true);
                          }}
                          title="Add Points"
                        >
                          <PlusCircle className="w-4 h-4" />
                          Add
                        </button>
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 font-semibold text-xs uppercase tracking-wide transition-colors duration-150 flex items-center gap-1.5"
                          onClick={() => handleEdit(up)}
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 font-semibold text-xs uppercase tracking-wide transition-colors duration-150 flex items-center gap-1.5"
                          onClick={() => handleDelete(up)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal Create/Edit - Tailwind Design */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] overflow-y-auto py-8" role="dialog" aria-modal="true">
          <div className="bg-white shadow-2xl max-w-2xl w-[90%] my-8 relative overflow-hidden animate-modal-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                {editingUserPoint ? (
                  <Pencil className="w-6 h-6 text-white" />
                ) : (
                  <PlusCircle className="w-6 h-6 text-white" />
                )}
                {editingUserPoint ? "Edit User Point" : "Create New User Point"}
              </h3>
              <button
                type="button"
                className="text-white/90 hover:text-white bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                onClick={() => setShowModal(false)}
                disabled={loading}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                {/* User & Center Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* User Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider">
                      <User className="inline-block w-4 h-4 mr-2 align-[-2px]" />
                      User <span className="text-red-600">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 leading-6 border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200"
                        placeholder="Search user by name or email..."
                        value={userSearch}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setShowUserDropdown(e.target.value.length > 0);
                          if (!e.target.value) {
                            setFormData(prev => ({ ...prev, user_id: "" }));
                          }
                        }}
                        onFocus={() => {
                          if (userSearch.length > 0) {
                            setShowUserDropdown(true);
                          }
                        }}
                        disabled={!!editingUserPoint}
                        required={!formData.user_id}
                      />
                      {showUserDropdown && !editingUserPoint && userSearch.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                          {users
                            .filter(user => {
                              const searchLower = userSearch.toLowerCase();
                              const fullName = (user.full_name || "").toLowerCase();
                              const username = (user.username || "").toLowerCase();
                              const email = (user.email || "").toLowerCase();
                              return fullName.includes(searchLower) || 
                                     username.includes(searchLower) || 
                                     email.includes(searchLower);
                            })
                            .slice(0, 10)
                            .map((user) => (
                              <div
                                key={user._id}
                                className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, user_id: user._id }));
                                  setUserSearch(`${user.full_name || user.username} (${user.email})`);
                                  setShowUserDropdown(false);
                                }}
                              >
                                <div className="font-semibold text-black">{user.full_name || user.username}</div>
                                <div className="text-xs text-gray-600">{user.email}</div>
                              </div>
                            ))}
                          {users.filter(user => {
                            const searchLower = userSearch.toLowerCase();
                            const fullName = (user.full_name || "").toLowerCase();
                            const username = (user.username || "").toLowerCase();
                            const email = (user.email || "").toLowerCase();
                            return fullName.includes(searchLower) || 
                                   username.includes(searchLower) || 
                                   email.includes(searchLower);
                          }).length === 0 && (
                            <div className="p-3 text-sm text-gray-500 text-center italic">No users found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {editingUserPoint && (
                      <small className="text-xs text-gray-500">
                        Cannot change user when editing
                      </small>
                    )}
                  </div>

                  {/* Center Field */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider">
                      <Building2 className="inline-block w-4 h-4 mr-2 align-[-2px]" />
                      Center <span className="text-red-600">*</span>
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 leading-6 border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200"
                        placeholder="Search center..."
                        value={centerSearch}
                        onChange={(e) => {
                          setCenterSearch(e.target.value);
                          setShowCenterDropdown(true);
                          if (!e.target.value) {
                            setFormData(prev => ({ ...prev, center_id: "" }));
                          }
                        }}
                        onFocus={() => setShowCenterDropdown(true)}
                        disabled={!!editingUserPoint}
                        required={!formData.center_id}
                      />
                      {showCenterDropdown && !editingUserPoint && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto">
                          {centers
                            .filter(center => 
                              center.name.toLowerCase().includes(centerSearch.toLowerCase())
                            )
                            .slice(0, 10)
                            .map((center) => (
                              <div
                                key={center._id}
                                className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, center_id: center._id }));
                                  setCenterSearch(center.name);
                                  setShowCenterDropdown(false);
                                }}
                              >
                                <div className="font-semibold text-black">{center.name}</div>
                              </div>
                            ))}
                          {centers.filter(center => 
                            center.name.toLowerCase().includes(centerSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="p-3 text-sm text-gray-500 text-center italic">No centers found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {editingUserPoint && (
                      <small className="text-xs text-gray-500">
                        Cannot change center when editing
                      </small>
                    )}
                  </div>
                </div>

                {/* Points & Total Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider">
                      <Award className="inline-block w-4 h-4 mr-2 align-[-2px]" />
                      Current Points
                    </label>
                    <div className="relative group">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500" />
                      <input
                        type="number"
                        name="points"
                        className="w-full pl-10 pr-3 py-2.5 leading-6 border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        value={formData.points}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider">
                      Total Points
                    </label>
                    <div className="relative group">
                      <Gem className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500" />
                      <input
                        type="number"
                        name="total_points"
                        className="w-full pl-10 pr-3 py-2.5 leading-6 border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                        value={formData.total_points}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2 mb-6">
                  <label className="block text-xs font-bold text-black uppercase tracking-wider">
                    <ToggleRight className="inline-block w-4 h-4 mr-2 align-[-2px]" />
                    Status
                  </label>
                  <select
                    name="status"
                    className="w-full px-3 py-2.5 leading-6 border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none pr-10"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">✓ Active</option>
                    <option value="inactive">○ Inactive</option>
                    <option value="suspended">✕ Suspended</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
                <button
                  type="button"
                  className="px-6 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium cursor-pointer transition-all hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 text-white text-sm font-medium cursor-pointer transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Processing...
                    </>
                  ) : (
                    <>{editingUserPoint ? "UPDATE" : "CREATE"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Points - Tailwind Design */}
      {showAddPointsModal && selectedUserPoint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]" role="dialog" aria-modal="true">
          <div className="bg-white shadow-xl max-w-md w-[90%] relative animate-modal-slide-up p-6">
            {/* Close button */}
            <button
              type="button"
              className="absolute top-4 right-4 text-gray-600 hover:bg-gray-100 w-7 h-7 flex items-center justify-center transition-colors"
              onClick={() => setShowAddPointsModal(false)}
              disabled={loading}
              aria-label="Close"
            >
              <span className="text-xl leading-none">×</span>
            </button>

            {/* Header */}
            <div className="-mx-6 -mt-6 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 mb-5">
              <h3 className="text-xl font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-white" />
                ADD POINTS
              </h3>
            </div>

            {/* Body */}
            <div className="space-y-4">
              {/* User Info Card */}
              <div className="bg-gray-50 border border-gray-300">
                <div className="flex justify-between items-center p-4 border-b border-gray-300">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">USER</span>
                  <span className="text-sm font-medium text-black">{selectedUserPoint.user?.full_name || selectedUserPoint.user?.username}</span>
                </div>
                <div className="flex justify-between items-center p-4 border-b border-gray-300">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">CENTER</span>
                  <span className="text-sm font-medium text-black">{selectedUserPoint.center?.name}</span>
                </div>
                <div className="flex justify-between items-center p-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">CURRENT POINTS</span>
                  <span className="text-2xl font-bold text-black">{selectedUserPoint.points}</span>
                </div>
              </div>

              {/* Input Section */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">POINTS TO ADD</label>
                <input
                  type="number"
                  className="w-full p-4 border-2 border-blue-500 text-center text-2xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={quickPoints}
                  onChange={(e) => setQuickPoints(Number(e.target.value))}
                  min="1"
                  placeholder="0"
                  autoFocus
                />
                {quickPoints > 0 && (
                  <div className="mt-3 flex justify-between items-center p-3 bg-blue-500 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wide">New Balance:</span>
                    <span className="text-lg font-bold">{selectedUserPoint.points + quickPoints} pts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                className="px-6 py-2 bg-white border border-blue-600 text-blue-600 text-sm font-medium cursor-pointer transition-all hover:bg-blue-600 hover:text-white disabled:opacity-50"
                onClick={() => setShowAddPointsModal(false)}
                disabled={loading}
              >
                CANCEL
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-blue-500 text-white text-sm font-medium cursor-pointer transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleAddPoints}
                disabled={loading || quickPoints === 0}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Processing...
                  </span>
                ) : (
                  `ADD ${quickPoints || 0} POINTS`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredUserPoints.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-6 mt-6 px-6 py-5 bg-white border border-gray-300">
          <span className="text-sm font-medium text-gray-600">
            Page <strong className="text-black">{currentPage}</strong> of {totalPages}
          </span>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 px-3 py-0 bg-white border text-sm font-medium transition-all flex items-center justify-center ${
                    currentPage === page 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserPointsManagement;
