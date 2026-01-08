import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../auth/useKeycloak";
import { getMe } from "../../api/authApi";
import { useNavigate, useParams } from "react-router-dom";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  addGroupMember,
  addBulkGroupMembers,
  updateGroupMemberRole,
  removeGroupMember,
} from "../../api/groupApi"; 
import { getGroupsByUser } from "../../api/groupUserApi";
import { useModal } from "../../components/ModalProvider";
import { searchUsers, fetchUserByName, fetchUserByEmail, findUsers } from "../../api/userApi";
import { fetchAvatarUser } from "../../api/avataApi"; // API lấy avatar
import { API_BASE_URL } from "../../utils/apiConfig";
import GroupCard from "../../components/Group/GroupCard";
import GroupGrid from "../../components/Group/GroupGrid";
import GroupHeader from "../../components/Group/GroupHeader";
import GroupFormModal from "../../components/Group/GroupFormModal";
import GroupMemberCard from "../../components/Group/GroupMemberCard";

const Groups: React.FC = () => {
    const navigate = useNavigate();
  const { groupId } = useParams<{ groupId?: string }>();
  const [groups, setGroups] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [userIdError, setUserIdError] = useState<string>("");
  const [hasPermissionError, setHasPermissionError] = useState<boolean>(false);
  const { userInfo } = useAuth();
  const { show, confirm } = useModal();
  const [userRoleMap, setUserRoleMap] = useState<{ [groupId: string]: string }>({});
  const [loading, setLoading] = useState(false);
  
  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  const [userAvatar, setUserAvatar] = useState<string>("/icons/g2.jpg");
  // Detect current base path (dashboard or admin)
  const basePath = window.location.pathname.includes('/admin') ? '/admin' : '/dashboard';
   
  // UI state
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<any>({ name: "", description: "" });
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [showManageMembers, setShowManageMembers] = useState(false);
  // In-group toolbar states
  const [membersSearch, setMembersSearch] = useState<string>("");
  const [membersRoleFilter, setMembersRoleFilter] = useState<'all' | 'Người tạo' | 'Quản trị viên' | 'Người xem'>('all');
  // Toolbar states
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'creator'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [memberPreviews, setMemberPreviews] = useState<Record<string, Array<{ avatar?: string; name?: string }>>>({});
  // Add-member username search state
  const [addUserQuery, setAddUserQuery] = useState<string>("");
  const [addUserResults, setAddUserResults] = useState<any[] | null>(null);
  const [addUserLoading, setAddUserLoading] = useState<boolean>(false);
  // Multiple users for add-member
  const [addedUsersForAdd, setAddedUsersForAdd] = useState<any[]>([]);
  // Animation states
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());
const [successRoles, setSuccessRoles] = useState<Set<string>>(new Set());

  const [apiUrl, setApiUrl] = useState("");
  const BASE_URL = API_BASE_URL;
  // Toast helper: mượt mà, ở góc dưới phải
  const notify = (
    type: 'success' | 'error',
    title: string,
    description?: string
  ) => {
    const isSuccess = type === 'success';
    toast.custom(
      (t) => (
        <div
          onClick={() => toast.dismiss(t.id)}
          className={`flex w-[360px] items-start gap-3 rounded-md border bg-white p-4 shadow-lg transition-all duration-300 ease-out ${
            isSuccess ? 'border-green-200' : 'border-red-200'
          } ${t.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
        >
          <div
            className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full ${
              isSuccess ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              {isSuccess ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <line x1="18" y1="6" x2="6" y2="18" />
              )}
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            {description && (
              <div className="text-sm text-gray-600">{description}</div>
            )}
          </div>
        </div>
      ),
      { duration: 2400, position: 'bottom-right' }
    );
  };
  useEffect(() => {

   
    const baseUrl = process.env.REACT_APP_API_URL;
   

    setApiUrl(baseUrl || "");
  }, []);
  // Debounced search for add-member username/email using backend /user/findUsers?infor=
  useEffect(() => {
    const q = addUserQuery.trim();
// Clear results immediately if query is empty
    if (!q) {
setAddUserResults(null);
      setAddUserLoading(false);
      return;
    }
    
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (cancelled) return;
      
      setAddUserLoading(true);
      try {
        // Prefer fuzzy search from backend suggestion API
        const res = await findUsers(q);
        if (cancelled) return;
        let list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (res ? [res] : []));
        // Keep only active and not-deleted users
        list = list.filter((u: any) => (u?.status ?? 'active') === 'active' && (u?.deleted_at == null));
        setAddUserResults(list);
      } catch (e) {
        if (!cancelled) {
          setAddUserResults([]);
        }
      } finally {
        if (!cancelled) {
          setAddUserLoading(false);
        }
      }
    }, 350);
    
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [addUserQuery]);

  // Load groups of current user
  const loadGroups = async () => {
    setLoading(true);
    setHasPermissionError(false);
    let uid = "";
    try {
      const me = await getMe();
      if (me?.success && me.data?._id) {
        uid = me.data._id;
      } else if (userInfo && (userInfo.id || userInfo._id)) {
        uid = userInfo.id || userInfo._id;
      } else {
        uid = localStorage.getItem("userId") || "";
      }
    } catch {
      uid = localStorage.getItem("userId") || "";
    }

    if (!uid) {
      setUserIdError("User ID not found. Please login again.");
      setLoading(false);
      return;
    }

    setUserId(uid);
    try {
      const res = await getGroupsByUser(uid);
      const raw = res?.data;
      if (!Array.isArray(raw)) {
        setGroups([]);
        setUserRoleMap({});
        setUserIdError("Invalid data returned from API.");
        return;
      }
      const validGroups = raw.filter((gm: any) => gm.group_id != null);
      setGroups(validGroups.map((gm: any) => ({ ...gm.group_id, role_in_group: gm.role_in_group })));
      const map: { [groupId: string]: string } = {};
      validGroups.forEach((gm: any) => {
        map[gm.group_id._id || gm.group_id.id] = gm.role_in_group;
      });
      setUserRoleMap(map);
      setUserIdError("");
    } catch (e: any) {
      console.error("Lỗi khi gọi getGroupsByUser:", e);
      
      // Check for permission errors
      if (e?.response?.status === 403) {
        setHasPermissionError(true);
        setUserIdError("");
      } else {
        setUserIdError("Error calling group API.");
      }
      
      setGroups([]);
      setUserRoleMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo]);

  // Filter groups (search + role filter)
  const allFilteredGroups = useMemo(() => {
    const kw = search.trim().toLowerCase();
    let list = groups;
    // Role filter on map built from getGroupsByUser result
    if (roleFilter !== 'all') {
      list = list.filter((g) => {
        const gid = g._id || g.id;
        const role = userRoleMap[gid];
        if (roleFilter === 'admin') return role === 'Quản trị viên';
        if (roleFilter === 'creator') return role === 'Người tạo';
        return true;
      });
    }
    if (kw) {
      list = list.filter((g) => (g.name || "").toLowerCase().includes(kw) || (g.description || "").toLowerCase().includes(kw));
    }
    return list;
  }, [groups, search, roleFilter, userRoleMap]);

  // Pagination calculations
  const totalGroups = allFilteredGroups.length;
  const totalPages = Math.ceil(totalGroups / itemsPerPage);
  
  // Get current page groups
  const filteredGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allFilteredGroups.slice(startIndex, endIndex);
  }, [allFilteredGroups, currentPage, itemsPerPage]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  // Pagination handler
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load members of selected group
  const handleSelectGroup = async (group: any) => {
    const gid = group._id || group.id;
    if (groupId !== gid) {
      navigate(`${basePath}/groups/${gid}`);
    }
  };

  // Load group by ID from URL
  useEffect(() => {
    if (!groupId) {
      setSelectedGroup(null);
      setGroupMembers([]);
      return;
    }
    // Find group in user's groups
    const group = groups.find(g => (g._id || g.id) === groupId);
    if (!group) {
      setSelectedGroup(null);
      setGroupMembers([]);
      return;
    }
    setSelectedGroup(group);
    setLoading(true);
    const loadMembers = async () => {
      try {
        const res = await getGroupMembers(groupId);
        const members = res.data || res;
        setGroupMembers(members);
      } catch (e) {
        setGroupMembers([]);
      } finally {
        setLoading(false);
      }
    };
    loadMembers();
  }, [groupId, groups]);

  // Derived filtered members for UI
  const filteredMembersInGroup = useMemo(() => {
    const kw = membersSearch.trim().toLowerCase();
    let list = groupMembers || [];
    if (membersRoleFilter !== 'all') {
      list = list.filter((m: any) => m?.role_in_group === membersRoleFilter);
    }
    if (kw) {
      list = list.filter((m: any) => {
        const u = (typeof m.user_id === 'object' && m.user_id) || (typeof m.user === 'object' && m.user) || null;
        const name = (u?.full_name || u?.fullName || u?.username || u?.name || '').toString().toLowerCase();
        return name.includes(kw);
      });
    }
    return list;
  }, [groupMembers, membersSearch, membersRoleFilter]);

  // Thêm hàm này vào trong component Groups của file Groups.tsx
const handleMemberClick = (memberId: string, currentGroupId: string) => {
    if (memberId && currentGroupId) {
        // Lấy basePath (ví dụ: /dashboard hoặc /admin)
        const basePath = window.location.pathname.includes('/admin') ? '/admin' : '/dashboard';
// Điều hướng đến route BoardMember với userId và groupId
        navigate(`${basePath}/groups/${currentGroupId}/board/user/${memberId}`);
    }
};
  // Fetch member counts and avatar previews for visible groups
  useEffect(() => {
    if (!filteredGroups || filteredGroups.length === 0) {
      setMemberCounts({});
      setMemberPreviews({});
      return;
    }
    let cancelled = false;
    const run = async () => {
      const entries = await Promise.allSettled(
        filteredGroups.map(async (g) => {
const gid = g._id || g.id;
          try {
            const res = await getGroupMembers(gid);
            const members = res?.data || res || [];
            const count = Array.isArray(members) ? members.length : 0;
            // Build up to 4 avatar previews
            const previews = await Promise.all(
              (Array.isArray(members) ? members : []).slice(0, 4).map(async (m: any) => {
                const user = typeof m.user_id === 'object' && m.user_id !== null ? m.user_id : (typeof m.user === 'object' && m.user !== null ? m.user : null);
                const name = user?.full_name || user?.fullName || user?.username || user?.name;
                const uid = user?._id || user?.id || m.user_id || m.user;
                const avatarPath = user?.avatar_url || user?.avatarUrl || user?.avatar || '';
                const base = API_BASE_URL;
                let avatar: string | undefined = undefined;
                if (avatarPath) {
                  if (/^https?:\/\//i.test(String(avatarPath))) {
                    avatar = String(avatarPath);
                  } else {
                    const clean = String(avatarPath).startsWith('/') ? String(avatarPath) : `/${String(avatarPath)}`;
                    avatar = `${base}${clean}`;
                  }
                } else if (uid) {
                  try {
                    const a = await fetchAvatarUser(String(uid));
                    avatar = a?.avatar_url || undefined;
                  } catch {}
                }
                return { avatar, name };
              })
            );
            return [gid, { count, previews }];
          } catch {
            return [gid, { count: 0, previews: [] }];
          }
        })
      );
      if (cancelled) return;
      const counts: Record<string, number> = {};
      const previewsMap: Record<string, Array<{ avatar?: string; name?: string }>> = {};
      entries.forEach((p) => {
        if (p.status === 'fulfilled') {
          const [gid, data] = p.value;
          counts[gid] = data.count;
          previewsMap[gid] = data.previews;
        }
      });
      setMemberCounts(counts);
      setMemberPreviews(previewsMap);
    };
    run();
    return () => { cancelled = true; };
  }, [filteredGroups]);

  // Create or update group
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
const payload = { name: form.name, description: form.description };
    if (!payload.name || payload.name.trim() === "") {
      notify('error', 'Missing group name', 'Please enter group name.');
      return;
    }
    try {
      if (editingGroup) {
        const groupId = editingGroup._id || editingGroup.id;
        if (!groupId) {
          notify('error', 'Missing group ID', 'Group ID not found for update.');
          return;
        }
        await updateGroup(groupId, payload);
        notify('success', 'Update successful!', 'Group has been updated successfully.');
      } else {
await createGroup(payload); // roles chỉ dùng cho UI mock, chưa gửi BE
        notify('success', 'Create successful!', 'Group has been created successfully.');
      }
      setShowForm(false);
      setForm({ name: "", description: "" });
      setEditingGroup(null);
      loadGroups();
    } catch (e: any) {
      let msg = "Failed to save group.";
      if (e?.response?.data?.message) msg += `\n${e.response.data.message}`;
      else if (e?.message) msg += `\n${e.message}`;
      notify('error', 'Operation failed!', 'Failed to save group.');
      console.error("updateGroup error", { payload, editingGroup }, e);
    }
  };

  // Delete group (chỉ cho phép nếu là quản trị viên hoặc người tạo)
  const handleDelete = async (id: string) => {
    if (userRoleMap[id] !== "Quản trị viên" && userRoleMap[id] !== "Người tạo") {
      notify('error', 'No permission', 'You do not have permission to delete this group.');
      return;
    }
    const ok = await confirm({ title: "Confirm", message: "Are you sure you want to delete this group?", variant: "info" });
    if (ok) {
      try {
        await deleteGroup(id);
        notify('success', 'Delete successful!', 'Group has been deleted successfully.');
        // Always reload groups list so deleted item disappears
        try {
          await loadGroups();
        } catch (loadErr) {
          // non-fatal: still attempt navigate
          console.warn('Failed to reload groups after delete', loadErr);
        }
        // If we're currently viewing the deleted group's detail page, navigate back to groups list
        if ((groupId || "") === id) {
          navigate(`${basePath}/groups`);
        }
      } catch (e: any) {
        let msg = "Failed to delete group.";
        if (e?.response?.data?.message) msg += `\n${e.response.data.message}`;
        else if (e?.message) msg += `\n${e.message}`;
        notify('error', 'Delete failed!', 'Failed to delete group.');
        console.error("deleteGroup error", id, e);
      }
    }
  };

  // Edit group -> mở form modal với dữ liệu sẵn có
  const handleEdit = (group: any) => {
    setEditingGroup(group);
    setForm({ name: group.name, description: group.description || "" });
    setShowForm(true);
  };

  // Add member to group (single)
  const handleAddMember = async (user_id: string, role_in_group: string) => {
    if (!selectedGroup) {
      notify('error', 'Error', 'No group selected.');
      return;
    }
    const requester_id = userId;
    const group_id = selectedGroup._id || selectedGroup.id;
    if (!requester_id || !user_id || !group_id || !role_in_group) {
      notify('error', 'Missing data', `Missing: ${!requester_id ? 'requester_id ' : ''}${!user_id ? 'user_id ' : ''}${!group_id ? 'group_id ' : ''}${!role_in_group ? 'role_in_group ' : ''}`);
      return;
    }
    try {
      await addGroupMember({ requester_id, user_id, group_id, role_in_group });
      handleSelectGroup(selectedGroup);
      notify('success', 'Success', 'Member has been added to the group.');
    } catch (e: any) {
      let msg = "Failed to add member.";
      if (e?.response?.data?.message) msg += `\n${e.response.data.message}`;
      else if (e?.message) msg += `\n${e.message}`;
      notify('error', 'Operation failed', msg);
      console.error("addGroupMember error", { requester_id, user_id, group_id, role_in_group }, e);
    }
  };

  // Add multiple members to group at once
  const handleAddBulkMembers = async (members: Array<{ user_id: string; role_in_group: string }>) => {
    if (!selectedGroup) {
      notify('error', 'Error', 'No group selected.');
      return;
    }
    const group_id = selectedGroup._id || selectedGroup.id;
    if (!group_id || !members || members.length === 0) {
      notify('error', 'Thiếu dữ liệu', 'Missing group_id or members list.');
      return;
    }
    try {
      const response = await addBulkGroupMembers({ group_id, members });
      
      // Show detailed results
      const successCount = response.data?.success?.length || 0;
      const errorCount = response.data?.errors?.length || 0;
      const totalCount = response.data?.total || members.length;
      
      let message = `Processed ${totalCount} members:\n`;
      message += `✅ Success: ${successCount}\n`;
      if (errorCount > 0) {
        message += `❌ Errors: ${errorCount}\n\n`;
        message += "Error details:\n";
        response.data?.errors?.forEach((err: any, idx: number) => {
          if (idx < 3) { // Show max 3 errors
            message += `- ${err.error}\n`;
          }
        });
        if (errorCount > 3) {
          message += `... and ${errorCount - 3} more errors`;
        }
      }
      
      notify(errorCount > 0 ? 'success' : 'success', errorCount > 0 ? 'Completed with errors' : 'Success', message);
      
      // Reload members
      try {
        const res = await getGroupMembers(group_id);
        setGroupMembers(res.data || res);
      } catch {}
    } catch (e: any) {
      let msg = "Failed to add members.";
      if (e?.response?.data?.message) msg += `\n${e.response.data.message}`;
      else if (e?.message) msg += `\n${e.message}`;
      notify('error', 'Operation failed', msg);
      console.error("addBulkGroupMembers error", { group_id, members }, e);
    }
  };

  // Update member role
const handleUpdateMemberRole = async (user_id: string, role_in_group: string) => {
    if (!selectedGroup) {
      notify('error', 'Error', 'No group selected.');
      return;
    }
    const requester_id = userId;
    const group_id = selectedGroup._id || selectedGroup.id;
    if (!requester_id || !user_id || !group_id || !role_in_group) {
      notify('error', 'Missing data', `Missing required field(s): ${!requester_id ? 'requester_id ' : ''}${!user_id ? 'user_id ' : ''}${!group_id ? 'group_id ' : ''}${!role_in_group ? 'role_in_group ' : ''}`);
      return;
    }
    
    // Bắt đầu animation loading
    setUpdatingRoles(prev => {
      const newSet = new Set(prev);
      newSet.add(user_id);
      return newSet;
    });
    setSuccessRoles(prev => {
      const newSet = new Set(prev);
      newSet.delete(user_id);
      return newSet;
    });
    
    try {
await updateGroupMemberRole({ requester_id, user_id, group_id, role_in_group });
      
      // Update local state immediately to reflect new role
      setGroupMembers(prevMembers => 
        prevMembers.map(member => {
          const currentUserId = member.user_id?._id || member.user_id?.id || member.user_id || member.user?._id || member.user?.id;
          if (currentUserId === user_id) {
            return { ...member, role_in_group };
          }
          return member;
        })
      );
// Kết thúc animation loading, hiển thị success
      setUpdatingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(user_id);
        return newSet;
      });
      
      setSuccessRoles(prev => {
        const newSet = new Set(prev);
        newSet.add(user_id);
        return newSet;
      });
      
      // Auto remove success state sau 2 seconds
      setTimeout(() => {
        setSuccessRoles(prev => {
          const newSet = new Set(prev);
          newSet.delete(user_id);
          return newSet;
        });
      }, 2000);
      
      // Also reload from server to ensure data consistency
      try {
        const res = await getGroupMembers(group_id);
        setGroupMembers(res.data || res);
      } catch {}
      
      // Notify success với delay nhẹ để user nhìn thấy animation
      setTimeout(() => {
        notify('success', 'Success', 'Member role has been updated.');
      }, 300);
    } catch (e: any) {
      // Kết thúc animation loading khi có lỗi
      setUpdatingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(user_id);
        return newSet;
      });
      
      let msg = "Failed to update member role.";
      if (e?.response?.data?.message) msg += `\n${e.response.data.message}`;
      else if (e?.message) msg += `\n${e.message}`;
      notify('error', 'Operation failed', msg);
      console.error("updateGroupMemberRole error", { requester_id, user_id, group_id, role_in_group }, e);
    }
  };

  // Remove member (chỉ cho phép nếu là quản trị viên hoặc người tạo)
  const handleRemoveMember = async (user_id: string, userName?: string) => {
    if (!selectedGroup) {
      notify('error', 'Error', 'No group selected.');
      return;
    }
    const group_id = selectedGroup._id || selectedGroup.id;
    if (userRoleMap[group_id] !== "Quản trị viên" && userRoleMap[group_id] !== "Người tạo") {
      notify('error', 'No permission', 'You do not have permission to remove members!');
      return;
    }
    if (!userId || !user_id || !group_id) {
      notify('error', 'Missing data', `Missing: ${!userId ? 'requester_id ' : ''}${!user_id ? 'user_id ' : ''}${!group_id ? 'group_id ' : ''}`);
      return;
    }
    
    // Show confirmation dialog
    const confirmed = await confirm({ 
      title: "Confirm remove member",
message: `Are you sure you want to remove member ${userName || 'this'} from the group?`, 
      variant: "info" 
    });
    
    if (!confirmed) {
      return; // User cancelled
    }
    
    try {
      await removeGroupMember({ requester_id: userId, user_id, group_id });
      // Reload members immediately after removing
      try {
        const res = await getGroupMembers(group_id);
        setGroupMembers(res.data || res);
      } catch {}
      // Toast success after successful removal
      notify('success', 'Success', 'Member has been removed from the group.');
    } catch (e: any) {
      let msg = "Failed to remove member.";
      if (e?.response?.data?.message) msg += `\n${e.response.data.message}`;
      else if (e?.message) msg += `\n${e.message}`;
      notify('error', 'Operation failed', msg);
      console.error("removeGroupMember error", { requester_id: userId, user_id, group_id }, e);
    }
  };

  return (
    <>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 lg:p-8">
      {userIdError && (
        <div className="mb-6 rounded border border-red-200 bg-red-100 px-4 py-3 text-sm font-semibold text-red-800">
          {userIdError}
        </div>
      )}

      {!groupId && (
        <>
          <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-4 sm:mb-6">
            <GroupHeader
              groupCount={totalGroups}
              searchValue={search}
              onSearchChange={setSearch}
              onCreateClick={() => {
                setShowForm(true);
                setEditingGroup(null);
                setForm({ name: "", description: "" });
              }}
              disabled={!!userIdError}
            />
          </div>

          {/* Groups Grid */}
          {hasPermissionError ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border border-gray-200">
              <div className="mb-6">
                <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 text-center max-w-md">
                You don't have permission to view groups. Please contact the administrator to request access.
              </p>
            </div>
          ) : (
            <GroupGrid
              groups={filteredGroups}
              loading={loading}
              memberCounts={memberCounts}
              userRoleMap={userRoleMap}
              onSelectGroup={handleSelectGroup}
              onDeleteGroup={handleDelete}
            />
          )}
        </>
      )}

      {/* Pagination Controls */}
      {!groupId && !loading && totalGroups > itemsPerPage && (
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 p-4 sm:p-6 lg:p-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`rounded-lg px-4 sm:px-5 py-2 text-sm font-semibold transition w-full sm:w-auto ${
              currentPage === 1
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-black text-white hover:opacity-90"
            }`}
          >
            ← Previous
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[44px] rounded-lg px-3.5 py-2 text-sm transition ${
                    currentPage === pageNum
                      ? "bg-black font-bold text-white"
                      : "border border-gray-200 bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`rounded-lg px-4 sm:px-5 py-2 text-sm font-semibold transition w-full sm:w-auto ${
              currentPage === totalPages
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-black text-white hover:opacity-90"
            }`}
          >
            Next →
          </button>

          <span className="ml-5 text-sm font-medium text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* Members section - Full overlay grid view */}
      {/* Do not show error screen while resolving group; simply skip rendering */}
      {selectedGroup && (
        <div className="fixed inset-0 z-[100] w-full overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 sm:p-6 lg:p-10">
          {/* Top row: name left, back right (no container frame) */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="text-xl sm:text-2xl font-semibold tracking-wide text-gray-900">
              {selectedGroup.name} - Members
            </div>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 w-full sm:w-auto"
              onClick={() => navigate(`${basePath}/groups`)}
            >
              Back
            </button>
          </div>

          {/* Second row removed: actions will live inside the toolbar below */}

          {/* Members toolbar */}
          <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 rounded-none border border-blue-100/80 bg-white/80 p-4 sm:p-6 lg:p-8 shadow-sm backdrop-blur-sm">
            {/* Left: search */}
            <div className="relative flex-1 w-full lg:min-w-[260px] lg:max-w-xl">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={membersSearch}
                onChange={(e) => setMembersSearch(e.target.value)}
                placeholder="Search members"
                className="w-full rounded-none border border-blue-200/70 bg-white px-10 py-2.5 text-[15px] font-medium text-blue-700 placeholder-blue-300 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {/* Middle: (filters removed as requested) */}
            {/* Right: actions */}
            <div className="flex flex-col sm:flex-row shrink-0 items-stretch sm:items-center gap-3 w-full lg:w-auto lg:ml-auto">
              <button
                className="inline-flex h-10 items-center justify-center rounded-md bg-teal-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 w-full sm:w-auto"
                onClick={() => setShowManageMembers(true)}
              >
                Manage Users
              </button>
              <button
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 w-full sm:w-auto"
                onClick={() => handleEdit(selectedGroup)}
              >
                Edit
              </button>
              {(userRoleMap[selectedGroup._id || selectedGroup.id] === 'Quản trị viên' ||
                userRoleMap[selectedGroup._id || selectedGroup.id] === 'Người tạo') && (
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 border border-red-500 w-full sm:w-auto"
                  onClick={() => handleDelete(selectedGroup._id || selectedGroup.id)}
                >
                  Remove Group
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 py-6 sm:py-8 lg:py-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMembersInGroup.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-blue-200 bg-white p-12 text-center text-blue-600">
                No members found
              </div>
            ) : (
            filteredMembersInGroup.map((m, idx) => {
              // Use the shared GroupMemberCard component for consistent styling
              // Determine current user id and updating state so we can pass props
              let user = null;
              if (typeof m.user_id === "object" && m.user_id !== null) {
                user = m.user_id;
              } else if (typeof m.user === "object" && m.user !== null) {
                user = m.user;
              }
              const currentUserId = user?._id || user?.id || m.user_id;
              const isUpdating = updatingRoles.has(currentUserId);
              const currentGroupId = selectedGroup?._id || '';

              return (
                <GroupMemberCard
                  key={m._id || m.id || idx}
                  member={m}
                  isUpdating={isUpdating}
                  baseUrl={BASE_URL}
                  onClick={() => handleMemberClick(currentUserId, currentGroupId)}
                />
              );
            })
            )}
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showManageMembers && selectedGroup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowManageMembers(false);
          }}
        >
          <div
            className="w-full max-w-4xl max-h-[85vh] overflow-visible rounded-none bg-white shadow-2xl ring-1 ring-black/5 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Manage Members: {selectedGroup.name}
              </h2>
              <button
                onClick={() => setShowManageMembers(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Name</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Role</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groupMembers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500">No members found</td>
                    </tr>
                  ) : (
                    groupMembers.map((m, idx) => {
                      let user: any = null;
                      if (typeof m.user_id === "object" && m.user_id !== null) {
                        user = m.user_id;
                      } else if (typeof m.user === "object" && m.user !== null) {
                        user = m.user;
                      }
                      const avatarPath = user?.avatar_url || user?.avatarUrl || user?.avatar || '';
                      const avatarUrl = avatarPath
                        ? `${BASE_URL}/${avatarPath.replace(/^\/+/, '')}`
                        : `${BASE_URL}/default-avatar.png`;
                      const fullName = user?.full_name || user?.fullName || user?.username || user?.name || 'Unknown User';
                      const currentUserId = user?._id || user?.id || m.user_id;
                      const isUpdating = updatingRoles.has(currentUserId);
                      const isSuccess = successRoles.has(currentUserId);

                      return (
                        <tr key={m._id || m.id || idx}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {avatarUrl ? (
                                <img src={avatarUrl} alt={fullName} className="h-9 w-9 rounded-full object-cover ring-2 ring-blue-100" />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-blue-600 text-white ring-2 ring-blue-100 flex items-center justify-center font-bold">
                                  {fullName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="font-medium text-gray-800">{fullName}</span>
                            </div>
                          </td>
                          <td className={`px-4 py-3 align-middle text-center ${isSuccess ? 'bg-green-50' : ''}`}>
                            <div className="relative inline-block">
                              <select
                                value={m.role_in_group}
                                onChange={(e) => handleUpdateMemberRole(currentUserId, e.target.value)}
                                disabled={isUpdating}
                                className={`rounded-none border border-blue-300 bg-blue-50/60 px-3 py-2 text-sm font-medium text-blue-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 ${isUpdating ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                              >
                                <option value="Người tạo">Creator</option>
                                <option value="Quản trị viên">Administrator</option>
                                <option value="Người xem">Viewer</option>
                              </select>
                              {isUpdating && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle text-center">
                            {(userRoleMap[selectedGroup._id || selectedGroup.id] === "Quản trị viên" ||
                              userRoleMap[selectedGroup._id || selectedGroup.id] === "Người tạo") &&
                              groupMembers.length > 1 && (
                                <div className="inline-flex justify-center">
                                  <button
                                    className="inline-flex items-center rounded-md border border-red-500 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                                    onClick={() => handleRemoveMember(user?._id || user?.id || m.user_id, fullName)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Add member UI */}
            <div className="border-t bg-gray-50/60">
              <div className="flex flex-col gap-3 px-6 pt-4 pb-7 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <input
                    className="w-full rounded-none border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter name or email to add member..."
                    value={addUserQuery}
                    onChange={(e) => setAddUserQuery(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && addUserQuery.trim()) {
                        try {
                          const res = await fetchUserByEmail(addUserQuery.trim());
                          const user = res?.data || res;
                          if (user && ((user.status && user.status !== 'active') || (user.deleted_at != null))) {
                            setAddUserQuery('');
                            setAddUserResults(null);
                            notify('success', 'Notice', 'Only active accounts can be added.');
                            return;
                          }
                          if (user) {
                            const alreadyAdded = addedUsersForAdd.some(a => a._id === user._id || a.id === user.id);
                            const alreadyMember = groupMembers.some(m => {
                              const memberId = m.user_id?._id || m.user_id?.id || m.user_id || m.user?._id || m.user?.id;
                              return memberId === user._id || memberId === user.id;
                            });
                            if (!alreadyAdded && !alreadyMember) {
                              setAddUserQuery('');
                              setAddUserResults(null);
                              setAddedUsersForAdd(prev => [...prev, user]);
                            } else {
                              setAddUserQuery('');
                              setAddUserResults(null);
                              notify('success', 'Notice', 'User has already been added or is already a member of the group.');
                            }
                          }
                        } catch {}
                      }
                    }}
                  />
                  {addUserLoading && <div className="mt-1 text-xs font-medium text-blue-600">Searching...</div>}
                  {!addUserLoading && addUserResults !== null && addUserResults.length === 0 && (
                    <div className="mt-1 text-xs text-gray-500">No users found</div>
                  )}
                  {addUserResults && addUserResults.length > 0 && (() => {
                    const filteredResults = addUserResults.filter(u => {
                      const userId = u._id || u.id;
                      const alreadyAdded = addedUsersForAdd.some(a => {
                        const addedId = a._id || a.id;
                        return addedId === userId;
                      });
                      const alreadyMember = groupMembers.some(m => {
                        let memberId: any = null;
                        if (m.user_id) {
                          if (typeof m.user_id === 'string') {
                            memberId = m.user_id;
                          } else if (typeof m.user_id === 'object') {
                            memberId = m.user_id._id || m.user_id.id;
                          }
                        } else if (m.user) {
                          if (typeof m.user === 'string') {
                            memberId = m.user;
                          } else if (typeof m.user === 'object') {
                            memberId = m.user._id || m.user.id;
                          }
                        }
                        return memberId === userId;
                      });
                      return !alreadyAdded && !alreadyMember;
                    });
                    if (filteredResults.length === 0) {
                      return <div className="mt-1 text-xs text-gray-500">User already added or is a member</div>;
                    }
                    return (
                      <ul
                        className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-none border border-gray-200 bg-white shadow-lg"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {filteredResults.map((u) => (
                          <li
                            key={u._id || u.id}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => {
                              setAddUserQuery('');
                              setAddUserResults(null);
                              setAddedUsersForAdd(prev => [...prev, u]);
                            }}
                            className="cursor-pointer px-3 py-2 text-sm hover:bg-blue-50"
                          >
                            <div className="font-medium text-gray-800">{u.username || u.full_name || u.email}</div>
                            <div className="text-xs text-gray-500">{u.email || ''}</div>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
                <select id="add-user-role" className="rounded-none border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none">
                  <option value="Người xem">Viewer</option>
                  <option value="Quản trị viên">Administrator</option>
                  <option value="Người tạo">Creator</option>
                </select>
                <button
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={async () => {
                    if (addedUsersForAdd.length === 0) {
                      notify('success', 'Notice', 'Please select at least 1 member to add.');
                      return;
                    }
                    const role_in_group = (document.getElementById("add-user-role") as HTMLSelectElement).value;
                    const members = addedUsersForAdd.map(u => ({
                      user_id: u._id || u.id,
                      role_in_group: role_in_group
                    })).filter(m => m.user_id);
                    if (members.length === 0) {
                      notify('error', 'Error', 'No valid user_id found.');
                      return;
                    }
                    await handleAddBulkMembers(members);
                    setAddedUsersForAdd([]);
                    setAddUserQuery('');
                    setAddUserResults(null);
                  }}
                  disabled={addedUsersForAdd.length === 0}
                >
                  Add {addedUsersForAdd.length > 0 ? `${addedUsersForAdd.length} ` : ''}Member(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Group Modal - Available globally */}
      {showForm && (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        setShowForm(false);
        setEditingGroup(null);
        setForm({ name: "", description: "" });
      }
    }}
  >
    <form
      onClick={(e) => e.stopPropagation()}
      onSubmit={handleSubmit}
      className="w-full max-w-xl bg-white rounded-none shadow-2xl ring-1 ring-black/5 overflow-hidden"
      aria-label={editingGroup ? 'Edit group dialog' : 'Create group dialog'}
    >
      <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b border-blue-500/60">
        <h2 className="text-lg font-semibold uppercase tracking-wide">{editingGroup ? 'Edit Group' : 'Create Group'}</h2>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setEditingGroup(null);
            setForm({ name: "", description: "" });
          }}
          className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-white/10"
          aria-label="Close dialog"
        >
          ×
        </button>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Group name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Enter group name..."
            className="w-full px-4 py-3 border border-blue-200 rounded-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Enter description (optional)..."
            className="w-full px-4 py-3 border border-blue-200 rounded-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setEditingGroup(null);
            setForm({ name: "", description: "" });
          }}
          className="px-4 py-2 rounded-lg border border-blue-200 text-blue-700 font-semibold hover:bg-blue-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3.5 py-2 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold shadow-md hover:scale-[1.01] transition inline-flex items-center gap-2 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {editingGroup ? 'Save changes' : 'Create group'}
        </button>
      </div>
    </form>
  </div>
)}
    </div>
    </>
  );
};

export default Groups;
