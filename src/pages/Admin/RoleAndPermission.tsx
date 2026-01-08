import React, { useEffect, useMemo, useState } from "react";
import { fetchAllRoles, createRole, updateRole, deleteRole } from "../../api/roleApi";
import { fetchAllPermissions, updateRolePermissions } from "../../api/permissionApi";
import { fetchAllUserRoles as fetchAllUserRolesMap } from "../../api/userRoleApi";
import { fetchAllRolePermission } from "../../api/role&permission";
import { createUser } from "../../api/userApi";
import { useModal } from "../../components/ModalProvider";
import LoadingScreen from "../../components/LoadingScreen";
import toast from "react-hot-toast";
import "../../styles/RoleAndPermission.css";

// Helpers
interface Permission {
  _id: string;
  id?: string;
  code: string;
  typePermission?: string;
}

interface Role {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  typePermission?: string;
}

function groupPermissionsByType(perms: Permission[]) {
  const grouped: Record<string, Permission[]> = {};
  perms.forEach((p) => {
    const type = p.typePermission || "Other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(p);
  });
  Object.keys(grouped).forEach((k) =>
    grouped[k].sort((a, b) => (a.code || "").localeCompare(b.code || ""))
  );
  return grouped;
}

// Small Pill
const Pill: React.FC<{ color?: string; children: React.ReactNode }> = ({ color = "#22c55e", children }) => (
  <span style={{
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    background: `${color}22`,
    color,
    fontSize: 12,
    fontWeight: 700
  }}>{children}</span>
);

const RoleAndPermission: React.FC = () => {
  const { confirm } = useModal();
  const [activeTab, setActiveTab] = useState<"roles" | "matrix">("roles");
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermMap, setRolePermMap] = useState<Record<string, Set<string>>>({});
  const [userRolesMap, setUserRolesMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState("");
  const [checkedPerms, setCheckedPerms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permRes, rpAllRes, urAllRes] = await Promise.all([
        fetchAllRoles(),
        fetchAllPermissions(),
        fetchAllRolePermission(),
        fetchAllUserRolesMap(),
      ]);

      const roleList: Role[] = rolesRes?.data || [];
      const permList: Permission[] = permRes?.data || [];
      const rpList = rpAllRes?.data || [];
      const urList = urAllRes?.data || [];

      const map: Record<string, Set<string>> = {};
      rpList.forEach((rp: any) => {
        const rid = rp.role_id?._id || rp.role_id;
        const pid = rp.permission_id?._id || rp.permission_id;
        if (!rid || !pid) return;
        if (!map[rid]) map[rid] = new Set();
        map[rid].add(pid);
      });

      const countMap: Record<string, number> = {};
      urList.forEach((ur: any) => {
        const rid = ur.role_id?._id || ur.role_id;
        if (!rid) return;
        countMap[rid] = (countMap[rid] || 0) + 1;
      });

      setRoles(roleList);
      setPermissions(permList);
      setRolePermMap(map);
      setUserRolesMap(countMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const grouped = useMemo(() => groupPermissionsByType(permissions), [permissions]);

  const filteredRoles = useMemo(() => {
    return roles.filter(r => (r.name || "").toLowerCase().includes(q.toLowerCase()));
  }, [roles, q]);

  const openCreate = () => {
    setEditingRole(null);
    setFormName("");
    setCheckedPerms(new Set());
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name || "");
    const rid = role._id || role.id!;
    const set = new Set(rolePermMap[rid] ? Array.from(rolePermMap[rid]) : []);
    setCheckedPerms(set);
    setModalOpen(true);
  };

  const togglePerm = (permId: string) => {
    setCheckedPerms(prev => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  };

  const selectCategory = (cat: string, checked: boolean) => {
    const perms = grouped[cat] || [];
    setCheckedPerms(prev => {
      const next = new Set(prev);
      perms.forEach(p => {
        const pid = p._id || p.id!;
        if (checked) next.add(pid);
        else next.delete(pid);
      });
      return next;
    });
  };

  const saveRole = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (!editingRole) {
        const created = await createRole({ name: formName.trim(), description: "" });
        const rid = created?.data?._id || created?.data?.id;
        if (rid && checkedPerms.size > 0) {
          await updateRolePermissions(rid, Array.from(checkedPerms));
        }
      } else {
        const rid = editingRole._id || editingRole.id!;
        await updateRole(rid, { name: formName.trim() });
        await updateRolePermissions(rid, Array.from(checkedPerms));
      }
      await loadData();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (role: Role) => {
    const rid = role._id || role.id!;
    if (!rid) return;
    
    const confirmed = await confirm({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete the role "${role.name}"?`,
      variant: 'error'
    });
    
    if (!confirmed) return;
    
    try {
      await deleteRole(rid);
      await loadData();
      toast.success(`Successfully deleted role group "${role.name}"!`);
    } catch (error) {
      toast.error('An error occurred while deleting the role!');
    }
  };

  const toggleMatrix = async (rid: string, pid: string) => {
    const set = new Set(rolePermMap[rid] ? Array.from(rolePermMap[rid]) : []);
    const isRemoving = set.has(pid);
    const roleName = roles.find(r => (r._id || r.id) === rid)?.name || "Role";
    const permCode = permissions.find(p => (p._id || p.id) === pid)?.code || "Permission";
    
    const confirmed = await confirm({
      title: isRemoving ? "Confirm Remove Permission" : "Confirm Add Permission",
      message: isRemoving 
        ? `Are you sure you want to remove permission "${permCode}" from role "${roleName}"?`
        : `Are you sure you want to add permission "${permCode}" to role "${roleName}"?`,
      variant: isRemoving ? "error" : "info"
    });
    
    if (!confirmed) return;
    
    try {
      if (set.has(pid)) set.delete(pid);
      else set.add(pid);
      setRolePermMap({ ...rolePermMap, [rid]: set });
      await updateRolePermissions(rid, Array.from(set));
      toast.success(isRemoving ? "Permission removed successfully!" : "Permission added successfully!");
    } catch (error) {
      toast.error("An error occurred. Please try again!");
    }
  };

  const selectAllForRole = async (rid: string) => {
    const roleName = roles.find(r => (r._id || r.id) === rid)?.name || "Role";
    
    const confirmed = await confirm({
      title: "Confirm Select All",
      message: `Are you sure you want to grant ALL permissions (${permissions.length} permissions) to role "${roleName}"?`,
      variant: "success"
    });
    
    if (!confirmed) return;
    
    try {
      const allPermIds = permissions.map(p => p._id || p.id!);
      const newSet = new Set(allPermIds);
      setRolePermMap({ ...rolePermMap, [rid]: newSet });
      await updateRolePermissions(rid, Array.from(newSet));
      toast.success(`Granted all ${permissions.length} permissions to "${roleName}" successfully!`);
    } catch (error) {
      toast.error("An error occurred. Please try again!");
    }
  };

  const deselectAllForRole = async (rid: string) => {
    const roleName = roles.find(r => (r._id || r.id) === rid)?.name || "Role";
    const currentPerms = rolePermMap[rid]?.size || 0;
    
    const confirmed = await confirm({
      title: "Confirm Remove All",
      message: `Are you sure you want to REMOVE ALL permissions (${currentPerms} permissions) from role "${roleName}"?`,
      variant: "error"
    });
    
    if (!confirmed) return;
    
    try {
      setRolePermMap({ ...rolePermMap, [rid]: new Set() });
      await updateRolePermissions(rid, []);
      toast.success(`Removed all permissions from "${roleName}" successfully!`);
    } catch (error) {
      toast.error("An error occurred. Please try again!");
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading data..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 p-6 mb-2 border border-blue-100 overflow-hidden">
          {/* Decorative blobs */}
          <span className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 bg-sky-200/40 blur-3xl"></span>
          <span className="pointer-events-none absolute -bottom-10 right-8 h-20 w-20 bg-blue-200/40 blur-3xl"></span>

          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">Role & Permission</h1>
              <p className="text-blue-600">Manage roles and permissions</p>
            </div>
            <button
              onClick={openCreate}
              className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Role
            </button>
          </div>
        </div>

        {/* Animated underline */}
        <div className="h-[3px] bg-gradient-to-r from-sky-300 via-blue-300 to-sky-300 opacity-70 animate-pulse mb-6"></div>

        {/* Tabs + Search */}
        <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 p-4 mb-6 border border-blue-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex bg-blue-50/60 p-1 border border-blue-100 w-fit">
            <button
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'roles' ? 'bg-white text-blue-700 shadow border border-blue-200' : 'text-blue-600 hover:text-blue-800'}`}
              onClick={() => setActiveTab('roles')}
            >
              Roles
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'matrix' ? 'bg-white text-blue-700 shadow border border-blue-200' : 'text-blue-600 hover:text-blue-800'}`}
              onClick={() => setActiveTab('matrix')}
            >
              Permission Matrix
            </button>
          </div>
          <div className="relative w-full md:max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="w-full pl-10 pr-4 py-3 border border-blue-200 bg-white/80 backdrop-blur-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 placeholder-blue-400 focus-visible:outline-none"
              placeholder="Search by role name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-blue-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Role Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Permissions</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {filteredRoles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <p className="text-blue-600 font-medium">No roles found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRoles.map((r) => {
                      const rid = r._id || r.id!;
                      const permCount = rolePermMap[rid]?.size || 0;
                      return (
                        <tr key={rid} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-blue-900">{r.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200">
                              {permCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-green-100 text-green-700 ring-1 ring-inset ring-green-200">
                              <span className="w-2 h-2 bg-green-500"></span>
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="p-2 text-blue-600 hover:bg-blue-100 active:bg-blue-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                                onClick={() => openEdit(r)}
                                title="Edit role"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                className="p-2 text-red-600 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                                onClick={() => removeRole(r)}
                                title="Delete role"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Matrix Tab */}
        {activeTab === 'matrix' && (
          <div className="bg-white/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow duration-200 p-4 border border-blue-100">
            <div className="overflow-x-auto">
              <div
                className="grid text-sm"
                style={{ gridTemplateColumns: `minmax(200px,1fr) repeat(${roles.length}, minmax(150px,1fr))` }}
              >
                <div className="px-3 py-2 font-semibold text-blue-900 bg-blue-50 border border-blue-100">FUNCTION</div>
                {roles.map((r) => (
                  <div key={r._id || r.id} className="px-3 py-2 bg-blue-50 border border-blue-100 flex flex-col items-center justify-center">
                    <div className="font-semibold text-blue-900 mb-2 text-center">{r.name}</div>
                    <div className="w-full flex flex-col gap-2">
                      <button
                        onClick={() => selectAllForRole(r._id || r.id!)}
                        className="px-2.5 py-1.5 text-xs rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                        title="Select all permissions"
                      >
                        ✓ Select All
                      </button>
                      <button
                        onClick={() => deselectAllForRole(r._id || r.id!)}
                        className="px-2.5 py-1.5 text-xs rounded-md bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                        title="Deselect all permissions"
                      >
                        ✕ Remove All
                      </button>
                    </div>
                  </div>
                ))}

                {Object.keys(grouped).map((cat) => (
                  <React.Fragment key={cat}>
                    <div className="px-3 py-2 font-semibold text-blue-800 bg-blue-100/60 border border-blue-100">📁 {cat}</div>
                    {roles.map((r) => (
                      <div key={(r._id || r.id) + cat} className="px-3 py-2 text-blue-400 border border-blue-100">—</div>
                    ))}
                    {grouped[cat].map((p) => {
                      const pid = p._id || p.id!;
                      return (
                        <React.Fragment key={pid}>
                          <div className="px-3 py-2 text-blue-900 border border-blue-100">{p.code}</div>
                          {roles.map((r) => {
                            const rid = r._id || r.id!;
                            const checked = rolePermMap[rid]?.has(pid) || false;
                            return (
                              <div key={rid + pid} className="px-3 py-2 flex items-center justify-center border border-blue-100">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-400"
                                  checked={checked}
                                  onChange={() => toggleMatrix(rid, pid)}
                                />
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={() => !saving && setModalOpen(false)}
          >
            <div
              className="bg-white shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-200 ring-1 ring-blue-100/60 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{editingRole ? 'Edit Role' : 'Add Role'}</h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-white hover:text-blue-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">Role Name *</label>
                  <input
                    className="w-full px-4 py-3 border border-blue-200 bg-white/90 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-blue-900 focus-visible:outline-none"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter role name"
                  />
                </div>

                <div>
                  <div className="text-blue-900 font-semibold mb-3">Function Permissions</div>
                  {Object.keys(grouped).map((cat) => {
                    const perms = grouped[cat];
                    const allChecked = perms.every((p) => checkedPerms.has(p._id || p.id!));
                    return (
                      <div key={cat} className="mb-5 border border-blue-100 overflow-hidden">
                        <label className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-900 font-semibold">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-400"
                            checked={allChecked}
                            onChange={(e) => selectCategory(cat, e.target.checked)}
                          />
                          <span>📁 {cat}</span>
                        </label>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {perms.map((p) => {
                            const pid = p._id || p.id!;
                            const checked = checkedPerms.has(pid);
                            return (
                              <label key={pid} className={`flex items-center gap-3 px-3 py-2 border ${checked ? 'bg-blue-50 border-blue-200' : 'bg-white border-blue-100'} transition-colors`}>
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-400"
                                  checked={checked}
                                  onChange={() => togglePerm(pid)}
                                />
                                <span className={`text-sm ${checked ? 'text-blue-700 font-semibold' : 'text-blue-900'}`}>{p.code}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-blue-50 px-6 py-4 flex items-center justify-end gap-4">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="px-6 py-2 text-blue-700 hover:bg-blue-100 active:bg-blue-200 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRole}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl active:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 flex items-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/70 border-t-transparent animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleAndPermission;
