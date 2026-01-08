import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useModal } from '../../components/ModalProvider';
import ToastNotification from '../../components/ToastNotification';
import {
  getAllCenters,
  createCenter,
  updateCenter,
  deleteCenter,
  Center,
  CreateCenterData,
  UpdateCenterData,
} from '../../api/centerApi';

const CenterManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/dashboard';
  const { show } = useModal();
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [centerToDelete, setCenterToDelete] = useState<Center | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('all');

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    description?: string;
  }>({ show: false, message: '' });

  // Form state
  const [formData, setFormData] = useState<CreateCenterData>({
    name: '',
    address: '',
    description: '',
    status: 'active',
    phone: '',
    email: '',
  });

  // Check if user is admin
  const rolesRaw = localStorage.getItem('roles');
  let isAdmin = false;
  try {
    const roles = rolesRaw ? JSON.parse(rolesRaw) : [];
    isAdmin = roles.some((r: string) => ['admin', 'System_Manager'].includes(r));
  } catch {
    isAdmin = false;
  }

  // Load centers
  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await getAllCenters();
      // Backend trả về: { success: true, count: X, data: [...] }
      if (response.success && response.data) {
        // Fetch members for each center using centerMember API
        const centersWithCounts = await Promise.all(
          response.data.map(async (center: any) => {
            try {
              // Import here to avoid circular dependency
              const { getCenterMembers } = await import('../../api/centerMemberApi');
              const membersResponse = await getCenterMembers(center._id);

              let memberCount = 0;
              if (membersResponse.success && Array.isArray(membersResponse.data)) {
                // Filter only valid members with user data
                memberCount = membersResponse.data.filter((m: any) => {
                  const userData = m.user || m;
                  return !!(userData.username || userData.user_name || userData.email);
                }).length;
              } else if (Array.isArray(membersResponse)) {
                memberCount = membersResponse.filter((m: any) => {
                  const userData = m.user || m;
                  return !!(userData.username || userData.user_name || userData.email);
                }).length;
              }

              return {
                ...center,
                memberCount,
                groupCount: 0, // TODO: Implement group count when groupMember API is available
              };
            } catch (err) {
              return {
                ...center,
                memberCount: 0,
                groupCount: 0,
              };
            }
          }),
        );

        setCenters(centersWithCounts);
      } else {
        setCenters([]);
      }
    } catch (error: any) {
      show({
        title: 'Error',
        message: 'Unable to load centers list',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open modal for create
  const handleCreate = () => {
    setEditingCenter(null);
    setFormData({
      name: '',
      address: '',
      description: '',
      status: 'active',
      phone: '',
      email: '',
    });
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = async (center: Center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      address: center.address || '',
      description: center.description || '',
      status: center.status,
      phone: center.phone || '',
      email: center.email || '',
    });
    setShowModal(true);
  };

  // Helper function to show toast
  const showToast = (message: string, description?: string) => {
    setToast({ show: true, message, description });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      show({
        title: 'Error',
        message: 'Center name cannot be empty',
        variant: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      if (editingCenter) {
        // Update
        await updateCenter(editingCenter._id, formData as UpdateCenterData);
        showToast('Successfully updated!', 'Center has been updated successfully.');
      } else {
        // Create
        await createCenter(formData);
        showToast('Successfully created!', 'Center has been created successfully.');
      }
      setShowModal(false);
      fetchCenters();
    } catch (error: any) {
      show({
        title: 'Error',
        message: error.response?.data?.message || 'An error occurred',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (center: Center) => {
    setCenterToDelete(center);
    setShowDeleteModal(true);
  };

  // Confirm delete center
  const confirmDelete = async () => {
    if (!centerToDelete) return;

    try {
      setLoading(true);
      await deleteCenter(centerToDelete._id);
      showToast('Successfully deleted!', 'Center has been deleted successfully.');
      setShowDeleteModal(false);
      setCenterToDelete(null);
      fetchCenters();
    } catch (error: any) {
      show({
        title: 'Error',
        message: error.response?.data?.message || 'Unable to delete center',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter centers (exclude soft-deleted), apply center selection and search
  const filteredCenters = centers
    .filter((c) => !c.deleted_at)
    .filter((c) => (selectedCenterId === 'all' ? true : c._id === selectedCenterId))
    .filter(
      (center) =>
        center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  // Calculate stats
  const stats = {
    total: filteredCenters.length,
    // Treat missing status as 'active' to match UI default
    active: filteredCenters.filter((c) => (c.status || 'active') === 'active').length,
    members: filteredCenters.reduce((sum, c) => sum + (c.memberCount || 0), 0),
    groups: filteredCenters.reduce((sum, c) => sum + (c.groupCount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 border-b border-blue-200">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 40 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Left building */}
                    <rect x="3" y="12" width="7" height="16" fill="#ffffff" stroke="none" />
                    <rect x="4" y="14" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="6.5" y="14" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="9.5" y="14" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="4" y="17" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="6.5" y="17" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="9.5" y="17" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="4" y="20" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="6.5" y="20" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="9.5" y="20" width="1.5" height="1.5" fill="#1e293b" />

                    {/* Center building */}
                    <rect x="13" y="10" width="7" height="18" fill="#ffffff" stroke="none" />
                    <rect x="14" y="12" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="16.5" y="12" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="19.5" y="12" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="14" y="15" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="16.5" y="15" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="19.5" y="15" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="14" y="18" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="16.5" y="18" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="19.5" y="18" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="14" y="21" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="16.5" y="21" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="19.5" y="21" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="16" y="24" width="2" height="2.5" fill="#1e293b" />

                    {/* Right building */}
                    <rect x="23" y="13" width="7" height="15" fill="#ffffff" stroke="none" />
                    <rect x="24" y="15" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="26.5" y="15" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="29.5" y="15" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="24" y="18" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="26.5" y="18" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="29.5" y="18" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="24" y="21" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="26.5" y="21" width="1.5" height="1.5" fill="#1e293b" />
                    <rect x="29.5" y="21" width="1.5" height="1.5" fill="#1e293b" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Centers Management
                  </h1>
                  <p className="text-sm text-blue-100">Manage centers and members</p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-3">
                  <div>
                    <select
                      className="rounded-md bg-white text-slate-700 font-semibold px-3 py-2 shadow-sm border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={selectedCenterId}
                      onChange={(e) => setSelectedCenterId(e.target.value)}
                      title="Select center to view"
                    >
                      <option value="all">All centers</option>
                      {centers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 text-white font-semibold px-4 py-2.5 shadow hover:bg-blue-700 transition"
                    onClick={handleCreate}
                  >
                    <i className="bi bi-plus-circle"></i>
                    Create New Center
                  </button>
                </div>
              )}
            </div>
            {/* Search section */}
            <div className="mt-4 bg-white border border-blue-200 rounded-none p-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  <input
                    type="text"
                    className="w-full rounded-none border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 py-2.5 pl-10 pr-3 text-sm"
                    placeholder="Search centers by name, address, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="whitespace-nowrap rounded-none border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                  <i className="bi bi-building mr-2 text-slate-500"></i>
                  <strong className="text-slate-900 mr-1">{filteredCenters.length}</strong>
                  Centers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total Centers */}
          <div className="bg-white rounded-none p-4 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center gap-3 h-24">
            <div className="w-9 h-9 rounded-md flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M3 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm1 2v10H1V2zm14 0v10h-3V2zm-3 0V1h3a1 1 0 0 1 1 1v1zm0 11v2a1 1 0 0 1-1 1h-3v-3zm-6 3H4a1 1 0 0 1-1-1v-2h3zm1-15H1a1 1 0 0 0-1 1v1h3V2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-slate-900 leading-none">{stats.total}</p>
              <p className="uppercase text-[11px] tracking-wider font-semibold text-slate-500">
                Total Centers
              </p>
            </div>
          </div>

          {/* Active Centers */}
          <div className="bg-white rounded-none p-4 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center gap-3 h-24">
            <div className="w-9 h-9 rounded-md flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-slate-900 leading-none">{stats.active}</p>
              <p className="uppercase text-[11px] tracking-wider font-semibold text-slate-500">
                Active Centers
              </p>
            </div>
          </div>

          {/* Total Members */}
          <div className="bg-white rounded-none p-4 border border-slate-100 shadow-sm hover:shadow-md transition flex items-center gap-3 h-24">
            <div className="w-9 h-9 rounded-md flex items-center justify-center text-violet-600 bg-violet-50 border border-violet-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6m-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1zM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xl font-semibold text-slate-900 leading-none">{stats.members}</p>
              <p className="uppercase text-[11px] tracking-wider font-semibold text-slate-500">
                Total Members
              </p>
            </div>
          </div>

          {/* Total Groups */}
          <div className="bg-white rounded-none p-4 border border-slate-100 shadow-sm hover:shadow-md transition h-24 flex items-center">
            <div className="w-9 h-9 rounded-md flex items-center justify-center text-orange-600 bg-orange-50 border border-orange-100 mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5.77 7.5h.25a.75.75 0 0 0 0-1.5h-.25a1.5 1.5 0 0 0-1.5-1.5H4a1.5 1.5 0 0 0 0 3zM14 6.5A1.5 1.5 0 0 0 12.5 5h-9A1.5 1.5 0 0 0 2 6.5v.5h12z" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xl font-semibold text-slate-900 leading-none">{stats.groups}</p>
              <p className="uppercase text-[11px] tracking-wider font-semibold text-slate-500">
                Total Groups
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Centers Grid */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-16">
        {loading && !showModal ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="uppercase text-sm tracking-wider font-semibold text-slate-500">
              Loading centers...
            </p>
          </div>
        ) : filteredCenters.length === 0 ? (
          <div className="bg-white rounded-none border-2 border-dashed border-slate-300 px-8 py-24 text-center">
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center">
              <i className="bi bi-building text-5xl text-slate-400"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No centers found</h3>
            <p className="text-slate-600">Create your first center to get started</p>
          </div>
        ) : (
          <>
            {/* Mobile list (sm) */}
            <div className="block md:hidden mt-4">
              <ul className="divide-y divide-slate-200 bg-white border border-slate-200">
                {filteredCenters.map((center) => (
                  <li key={center._id} className="p-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-slate-900 truncate">
                          {center.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider inline-flex items-center justify-center text-center min-w-[68px] ${
                            (center.status || 'active') === 'active'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                              : (center.status || 'active') === 'maintenance'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {getStatusText(center.status || 'active').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {center.description || 'No description'}
                      </p>
                      {center.address && (
                        <div className="mt-2 text-sm text-slate-700 truncate">
                          <i className="bi bi-geo-alt text-slate-400 mr-1" />
                          {center.address}
                        </div>
                      )}
                      {center.email && (
                        <div className="text-sm text-slate-700 truncate">
                          <i className="bi bi-envelope text-slate-400 mr-1" />
                          {center.email}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        aria-label="View members"
                        className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 bg-white text-slate-700 text-xs hover:bg-blue-50 hover:border-blue-200"
                        onClick={() => navigate(`${basePath}/centers/${center._id}/members`)}
                      >
                        <i className="bi bi-people" />
                        <strong>{center.memberCount || 0}</strong>
                      </button>
                      <div className="inline-flex items-center gap-1 px-2 py-1 border border-slate-200 bg-white text-slate-700 text-xs">
                        <i className="bi bi-collection" />
                        <strong>{center.groupCount || 0}</strong>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs"
                            onClick={() => handleEdit(center)}
                          >
                            <i className="bi bi-pencil" />
                          </button>
                          <button
                            className="inline-flex items-center gap-1 px-2 py-1 bg-rose-500 text-white text-xs"
                            onClick={() => handleDeleteClick(center)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Desktop grid (md+) */}
            <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
              {filteredCenters.map((center) => (
                <div
                  key={center._id}
                  className="bg-white rounded-none border border-slate-200 shadow-[0_2px_10px_rgba(2,6,23,0.06)] hover:shadow-md hover:-translate-y-0.5 transition flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between gap-4 border-l-4 border-blue-500 pl-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 leading-snug truncate">
                        {center.name}
                      </h3>
                      <p className="text-sm text-slate-500 truncate">
                        {center.description || 'No description'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center text-center min-w-[88px] ${
                        (center.status || 'active') === 'active'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : (center.status || 'active') === 'maintenance'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {getStatusText(center.status || 'active').toUpperCase()}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 bg-white text-left">
                    <ul className="space-y-2 text-left list-none pl-0 m-0 w-full mx-0 items-stretch flex flex-col">
                      {center.address && (
                        <li className="w-full mx-0 flex items-stretch justify-start p-0 border border-slate-200 bg-slate-50 hover:bg-white transition">
                          <span
                            className="w-full px-3 py-2 text-sm text-slate-800 truncate text-left"
                            title={center.address}
                          >
                            {center.address}
                          </span>
                        </li>
                      )}
                      {center.phone && (
                        <li className="w-full mx-0 flex items-stretch justify-start p-0 border border-slate-200 bg-slate-50 hover:bg-white transition">
                          <span
                            className="w-full px-3 py-2 text-sm text-slate-800 truncate text-left"
                            title={center.phone}
                          >
                            {center.phone}
                          </span>
                        </li>
                      )}
                      {center.email && (
                        <li className="w-full mx-0 flex items-stretch justify-start p-0 border border-slate-200 bg-slate-50 hover:bg-white transition">
                          <span
                            className="w-full px-3 py-2 text-sm text-slate-800 truncate text-left"
                            title={center.email}
                          >
                            {center.email}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="View members"
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 text-sm hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition"
                        onClick={() => navigate(`${basePath}/centers/${center._id}/members`)}
                      >
                        <i className="bi bi-people"></i>
                        <strong>{center.memberCount || 0}</strong> members
                      </button>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white text-slate-700 text-sm">
                        <i className="bi bi-collection"></i>
                        <strong>{center.groupCount || 0}</strong> groups
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow hover:from-blue-700 hover:to-blue-800 transition"
                          onClick={() => handleEdit(center)}
                        >
                          <i className="bi bi-pencil"></i>
                          Edit
                        </button>
                        <button
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-br from-rose-500 to-red-600 text-white shadow hover:from-rose-600 hover:to-red-700 transition"
                          onClick={() => handleDeleteClick(center)}
                        >
                          <i className="bi bi-trash"></i>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[1050] bg-black/50 backdrop-blur-sm flex items-center justify-center p-1">
          <div className="w-full max-w-3xl max-h-[75vh] overflow-hidden rounded-none bg-white shadow-2xl flex flex-col">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-2 flex items-center justify-between">
              <h5 className="text-white text-base font-bold">
                {editingCenter ? 'Edit Center' : 'Create New Center'}
              </h5>
              <button
                type="button"
                className="w-8 h-8 inline-flex items-center justify-center rounded-md text-white/90 hover:bg-white/20 text-xl"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-2 pb-4 bg-white">
                <div className="mb-2">
                  <label className="block font-semibold text-slate-700 text-sm mb-1">
                    Center Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-none border border-slate-200 px-3 py-1.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    maxLength={200}
                    placeholder="Enter center name"
                  />
                </div>

                <div className="mb-2">
                  <label className="block font-semibold text-slate-700 text-sm mb-1">Address</label>
                  <input
                    type="text"
                    className="w-full rounded-none border border-slate-200 px-3 py-1.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    maxLength={500}
                    placeholder="Enter address"
                  />
                </div>

                <div className="mb-2">
                  <label className="block font-semibold text-slate-700 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full rounded-none border border-slate-200 px-3 py-1.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    maxLength={100}
                    placeholder="Email address"
                  />
                </div>

                <div className="mb-2">
                  <label className="block font-semibold text-slate-700 text-sm mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full rounded-none border border-slate-200 px-3 py-1.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 min-h-[48px]"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={2}
                    maxLength={1000}
                    placeholder="Enter center description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="mb-2">
                    <label className="block font-semibold text-slate-700 text-sm mb-1">
                      Status
                    </label>
                    <select
                      className="w-full rounded-none border border-slate-200 px-3 py-1.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="mb-2">
                    <label className="block font-semibold text-slate-700 text-sm mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full rounded-none border border-slate-200 px-3 py-1.5 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength={20}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : editingCenter ? (
                    'Update Center'
                  ) : (
                    'Create Center'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && centerToDelete && (
        <div className="fixed inset-0 z-[1050] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setCenterToDelete(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:bg-slate-100 w-9 h-9 inline-flex items-center justify-center rounded-md text-lg"
              aria-label="Close"
            >
              ×
            </button>

            <div className="pt-4 pb-2">
              <p className="text-slate-800 text-center text-[15px] leading-6">
                Are you sure you want to delete center
                {centerToDelete?.name ? (
                  <>
                    {' '}
                    <span className="font-semibold"> {centerToDelete.name}</span>?
                  </>
                ) : (
                  <>?</>
                )}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCenterToDelete(null);
                }}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <ToastNotification
          message={toast.message}
          description={toast.description}
          onClose={() => setToast({ show: false, message: '' })}
        />
      )}
    </div>
  );
};

export default CenterManagement;
