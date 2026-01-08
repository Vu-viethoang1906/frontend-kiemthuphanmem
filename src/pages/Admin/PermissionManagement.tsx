import React, { useEffect, useState } from "react";
import {
  fetchAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "../../api/permissionApi";
import { useModal } from "../../components/ModalProvider";
import LoadingScreen from "../../components/LoadingScreen";

interface Permission {
  _id?: string;
  id?: string;
  description: string;
  code: string;
  typePermission: string;
  created_at?: string;
  updated_at?: string;
}

const PermissionManagement: React.FC = () => {
  const modal = useModal();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState<{
    description: string;
    code: string;
    typePermission: string;
  }>({
    description: "",
    code: "",
    typePermission: "",
  });

  // Load permissions
  const loadPermissions = async () => {
    try {
      setLoading(true);
      const res = await fetchAllPermissions();
      if (res.success && res.data) {
        setPermissions(Array.isArray(res.data) ? res.data : []);
      } else {
        setPermissions([]);
      }
      } catch (err: any) {
      console.error("❌ loadPermissions error:", err);
      setPermissions([]);
      modal.show({
        title: "Error",
        message: "Unable to load permissions list. Please try again.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // Get unique permission types
  const permissionTypes = Array.from(
    new Set(permissions.map((p) => p.typePermission).filter(Boolean))
  );

  // Filter permissions
  const filteredPermissions = permissions.filter((perm) => {
    const matchSearch =
      searchTerm === "" ||
      perm.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.typePermission.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = filterType === "all" || perm.typePermission === filterType;

    return matchSearch && matchType;
  });

  // Handle create
  const handleCreate = () => {
    setEditingPermission(null);
    setForm({
      description: "",
      code: "",
      typePermission: "",
    });
    setShowModal(true);
  };

  // Handle edit
  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setForm({
      description: permission.description || "",
      code: permission.code || "",
      typePermission: permission.typePermission || "",
    });
    setShowModal(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      // Validation
      if (!form.code.trim()) {
        modal.show({
          title: "Error",
          message: "Code cannot be empty!",
          variant: "error",
        });
        return;
      }

      if (!form.description.trim()) {
        modal.show({
          title: "Error",
          message: "Description cannot be empty!",
          variant: "error",
        });
        return;
      }

      if (!form.typePermission.trim()) {
        modal.show({
          title: "Error",
          message: "Type Permission cannot be empty!",
          variant: "error",
        });
        return;
      }

      if (editingPermission?._id || editingPermission?.id) {
        // Update
        const id = editingPermission._id || editingPermission.id || "";
        await updatePermission(id, form);
        modal.show({
          title: "Success",
          message: "Permission updated successfully!",
          variant: "success",
        });
      } else {
        // Create
        await createPermission(form);
        modal.show({
          title: "Success",
          message: "New permission created successfully!",
          variant: "success",
        });
      }

      setShowModal(false);
      await loadPermissions();
    } catch (err: any) {
      console.error("❌ save permission error:", err);
      modal.show({
        title: "Error",
        message:
          err?.response?.data?.message ||
          "Unable to save permission. Please try again.",
        variant: "error",
      });
    }
  };

  // Handle delete
  const handleDelete = async (id?: string) => {
    if (!id) return;

    const confirmed = await modal.confirm({
      title: "Confirm deletion",
      message: "Are you sure you want to delete this permission?",
      variant: "error",
    });

    if (!confirmed) return;

    try {
      await deletePermission(id);
      modal.show({
        title: "Success",
        message: "Permission deleted successfully!",
        variant: "success",
      });
      await loadPermissions();
    } catch (err: any) {
      console.error("❌ delete permission error:", err);
      modal.show({
        title: "Error",
        message:
          err?.response?.data?.message ||
          "Unable to delete permission. Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 p-6 mb-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                Permission Management
              </h1>
              <p className="text-blue-600">
                Manage access rights in the system.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 flex items-center gap-2"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create Permission
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 p-6 mb-6 border border-blue-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 border border-blue-200 bg-white/80 backdrop-blur-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 placeholder-blue-400 focus-visible:outline-none"
                placeholder="Search by code, description, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Filter */}
            <select
              className="px-4 py-3 border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 bg-white/80 backdrop-blur-sm min-w-[200px] focus-visible:outline-none"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              {permissionTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Permissions</p>
                <p className="text-2xl font-bold text-blue-900">{permissions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3">
                <svg
                  className="w-8 h-8 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-blue-600 text-sm font-medium">Permission Types</p>
                <p className="text-2xl font-bold text-blue-900">
                  {permissionTypes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="bg-cyan-100 p-3">
                <svg
                  className="w-8 h-8 text-cyan-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <p className="text-blue-600 text-sm font-medium">Filtered Results</p>
                <p className="text-2xl font-bold text-blue-900">
                  {filteredPermissions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Table */}
        <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-blue-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12">
                      <LoadingScreen message="Loading permissions..." minimal />
                    </td>
                  </tr>
                ) : filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <svg
                          className="w-16 h-16 text-blue-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-blue-600 font-medium">
                          No permissions found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((permission) => (
                    <tr
                      key={permission._id || permission.id}
                      className="hover:bg-blue-50 focus-within:bg-blue-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-blue-900">
                          {permission.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-blue-800">{permission.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200">
                          {permission.typePermission}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-blue-600 text-sm">
                        {permission.created_at
                          ? new Date(permission.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(permission)}
                            className="p-2 text-blue-600 hover:bg-blue-100 active:bg-blue-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                            title="Edit"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(permission._id || permission.id)
                            }
                            className="p-2 text-red-600 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                            title="Delete"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => setShowModal(false)}
          >
            <div
              className="bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-200 ring-1 ring-blue-100/60 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingPermission ? "Edit Permission" : "Create New Permission"}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-white hover:text-blue-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    Code *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-blue-200 bg-white/90 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 focus-visible:outline-none"
                    placeholder="Enter permission code (e.g., USER_CREATE)"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-blue-200 bg-white/90 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 focus-visible:outline-none"
                    placeholder="Enter permission description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    Type Permission *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-blue-200 bg-white/90 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 focus-visible:outline-none"
                    placeholder="Enter permission type (e.g., User, Board, Role)"
                    value={form.typePermission}
                    onChange={(e) =>
                      setForm({ ...form, typePermission: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-blue-50 px-6 py-4 flex items-center justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 text-blue-700 hover:bg-blue-100 active:bg-blue-200 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {editingPermission ? "Update Permission" : "Create Permission"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionManagement;