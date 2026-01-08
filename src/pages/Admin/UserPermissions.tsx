import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getRolebyIdUser,
  fetchAllPermission,
  fetchAllRolePermission,
  updateRolePermissions
} from '../../api/role&permission';

interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

interface PermissionItem {
  checked: boolean;
  id: string;
}

interface PermissionCategory {
  [permissionName: string]: PermissionItem;
}

interface PermissionsFromBackend {
  [category: string]: PermissionCategory;
}

const UserPermissions: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User>({
    id: userId || '',
    username: 'userId',
    full_name: 'Demo User',
    email: 'demo@example.com',
  });

  const [permissions, setPermissions] = useState<PermissionsFromBackend>({});
  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>({});

  const getCategoryFromCode = (code: string) => {
    if (code.startsWith('USER_')) return 'User';
    if (code.startsWith('GROUP_')) return 'Group';
    if (code.startsWith('BOARD_')) return 'Board';
    if (code.startsWith('TASK_')) return 'Task';
    if (code.startsWith('TAG_')) return 'Tag';
    if (code.startsWith('REPORT_')) return 'Report';
    return 'Other';
  };
useEffect(() => {
  const loadUserPermissions = async () => {
    if (!userId) return;

    try {
      // --- 1️⃣ Lấy tất cả role của user ---
      const roleResp = await getRolebyIdUser(userId);
      const userRoles: { _id: string; [key: string]: any }[] = roleResp?.data || [];
      if (userRoles.length === 0) return;

      // --- 2️⃣ Lấy tất cả permission hệ thống ---
      const allPermResp = await fetchAllPermission();
      const allPermissions: { _id: string; code: string; category?: string }[] = allPermResp?.data || [];

      // --- 3️⃣ Lấy tất cả role-permission ---
      const allRolePermResp = await fetchAllRolePermission();
      const allRolePerms: { role_id: { _id: string } | null; permission_id: { _id: string } | null }[] =
        allRolePermResp?.data || [];

      // --- 4️⃣ Tạo Set chứa tất cả permission của các role user ---
      const rolePermsSet = new Set(
        allRolePerms
          .filter(
            (rp) =>
              rp.role_id?._id &&
              rp.permission_id?._id &&
              userRoles.some((role) => role._id && role._id === rp.role_id!._id)
          )
          .map((rp) => rp.permission_id!._id)
      );

      // --- 5️⃣ Tạo object category -> permissions ---
      const categoryMap: PermissionsFromBackend = {};
      allPermissions.forEach((p) => {
        const category = p.category || getCategoryFromCode(p.code);
        if (!categoryMap[category]) categoryMap[category] = {};
        categoryMap[category][p.code] = {
          checked: rolePermsSet.has(p._id),
          id: p._id,
        };
      });
      setPermissions(categoryMap);
    } catch (err) {
      console.error('Lỗi tải phân quyền:', err);
    }
  };

  loadUserPermissions();
}, [userId]);

  const toggleCollapse = (category: string) => {
    setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSavePermissions = async () => {
    if (!userId) return;

    try {
      const checkedPermissionIds: string[] = [];
      Object.values(permissions).forEach(perms => {
        Object.values(perms).forEach(p => {
          if (p.checked) checkedPermissionIds.push(p.id);
        });
      });

      const res = await updateRolePermissions(userId, checkedPermissionIds);
    } catch (err) {
      console.error('Lỗi lưu phân quyền:', err);
    }
  };

  const handleCancel = () => {
    navigate('/admin/usermanagement');
  };

  const renderPermissionSection = (categoryKey: string) => {
    const sectionPermissions = permissions[categoryKey];
    if (!sectionPermissions) return null;
    const collapsed = collapsedCategories[categoryKey];

    return (
      <div key={categoryKey} style={{ background: '#fff', border: '2px solid #E3F2FD', borderRadius: 12, marginBottom: 16 }}>
        <div
          onClick={() => toggleCollapse(categoryKey)}
          style={{ background: '#90CAF9', color: '#fff', padding: '16px 24px', borderRadius: '10px 10px 0 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
        >
          {categoryKey.toUpperCase()} {collapsed ? '▶' : '▼'}
        </div>
        {!collapsed && (
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {Object.entries(sectionPermissions).map(([permName, perm]) => (
                <label
                  key={permName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: perm.checked ? '#F3F9FF' : '#fff',
                    borderRadius: 8,
                    border: perm.checked ? '2px solid #90CAF9' : '1px solid #E5E5E5',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={perm.checked}
                    onChange={e =>
                      setPermissions(prev => ({
                        ...prev,
                        [categoryKey]: {
                          ...prev[categoryKey],
                          [permName]: { ...perm, checked: e.target.checked }
                        }
                      }))
                    }
                    style={{ width: 18, height: 18, accentColor: '#90CAF9' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: perm.checked ? 600 : 400, color: perm.checked ? '#42A5F5' : '#666' }}>
                    {permName}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: 'calc(100vh - 60px)', padding: 24 }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: 32, marginBottom: 24, color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, marginBottom: 8 }}>🔐 User Permissions</h1>
            <p style={{ margin: 0, fontSize: 16, opacity: 0.9 }}>
              Manage permissions for <strong>{user.full_name}</strong> ({user.username})
            </p>
          </div>
          <button onClick={handleCancel} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            ← Back
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: 32 }}>
          {Object.keys(permissions).map(renderPermissionSection)}

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 24, marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
            <button onClick={handleCancel} style={{ padding: '14px 28px', border: '2px solid #ddd', borderRadius: 12, background: '#f8f9fa', color: '#666', cursor: 'pointer', fontSize: 15, fontWeight: 600 }}>
              ❌ Cancel
            </button>
            <button onClick={handleSavePermissions} style={{ padding: '14px 32px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
              ✅ Save permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPermissions;
