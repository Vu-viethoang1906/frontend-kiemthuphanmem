import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchRoleById,
  fetchAllPermissions,
  fetchPermissionsByRole,
  updateRolePermissions,
} from "../../api/permissionApi";
import { useModal } from "../../components/ModalProvider";

interface PermissionItem {
  checked: boolean;
  id: string;
  code: string;
}

interface PermissionCategory {
  [permissionName: string]: PermissionItem;
}

interface PermissionsGrouped {
  [category: string]: PermissionCategory;
}

const RolePermissionEdit: React.FC = () => {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const { show } = useModal();

  const [role, setRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<PermissionsGrouped>({});
  const [collapsedCategories, setCollapsedCategories] = useState<{ [key: string]: boolean }>({});

  const getCategoryFromCode = (code: string) => {
    if (code.startsWith("USER_")) return "User";
    if (code.startsWith("GROUP_")) return "Group";
    if (code.startsWith("BOARD_")) return "Board";
    if (code.startsWith("TASK_")) return "Task";
    if (code.startsWith("TAG_")) return "Tag";
    if (code.startsWith("REPORT_")) return "Report";
    return "Other";
  };

  useEffect(() => {
    const loadData = async () => {
      if (!roleId) return;
      try {
        // 1️⃣ Lấy thông tin role
        const roleRes = await fetchRoleById(roleId);
        const roleData = roleRes?.data || roleRes;
        setRole(roleData);

        // 2️⃣ Lấy tất cả quyền
        const allPermRes = await fetchAllPermissions();
        const allPerms = allPermRes?.data || allPermRes;

        // 3️⃣ Lấy quyền của role hiện tại
        const rolePermRes = await fetchPermissionsByRole(roleId);
        const rolePerms = rolePermRes?.data || [];

        const rolePermSet = new Set(
          rolePerms.map((p: any) => p.permission_id?._id)
        );

        // 4️⃣ Gom nhóm quyền theo category
        const grouped: PermissionsGrouped = {};
        allPerms.forEach((p: any) => {
          const category = getCategoryFromCode(p.code);
          if (!grouped[category]) grouped[category] = {};
          grouped[category][p.code] = {
            checked: rolePermSet.has(p._id),
            id: p._id,
            code: p.code,
          };
        });

        setPermissions(grouped);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      }
    };

    loadData();
  }, [roleId]);

  const toggleCollapse = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSavePermissions = async () => {
    if (!roleId) return;
    try {
      const checkedPermissionIds: string[] = [];
      Object.values(permissions).forEach((perms) => {
        Object.values(perms).forEach((p) => {
          if (p.checked) checkedPermissionIds.push(p.id);
        });
      });

      await updateRolePermissions(roleId, checkedPermissionIds);
      show({ title: "Thành công", message: "Cập nhật quyền thành công!", variant: "success" });
      navigate("/admin/roleandpermission");
    } catch (err) {
      console.error("Lỗi khi lưu quyền:", err);
      show({ title: "Lỗi", message: "Cập nhật quyền thất bại!", variant: "error" });
    }
  };

  const handleCancel = () => navigate("/admin/roleandpermission");

  const renderPermissionSection = (categoryKey: string) => {
    const section = permissions[categoryKey];
    const collapsed = collapsedCategories[categoryKey];
    if (!section) return null;

    return (
      <div
        key={categoryKey}
        style={{
          background: "#fff",
          border: "2px solid #E3F2FD",
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <div
          onClick={() => toggleCollapse(categoryKey)}
          style={{
            background: "#90CAF9",
            color: "#fff",
            padding: "16px 24px",
            borderRadius: "10px 10px 0 0",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          {categoryKey.toUpperCase()} {collapsed ? "▶" : "▼"}
        </div>

        {!collapsed && (
          <div style={{ padding: 24 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {Object.entries(section).map(([permName, perm]) => (
                <label
                  key={permName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: perm.checked ? "#F3F9FF" : "#fff",
                    borderRadius: 8,
                    border: perm.checked
                      ? "2px solid #90CAF9"
                      : "1px solid #E5E5E5",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={perm.checked}
                    onChange={(e) =>
                      setPermissions((prev) => ({
                        ...prev,
                        [categoryKey]: {
                          ...prev[categoryKey],
                          [permName]: { ...perm, checked: e.target.checked },
                        },
                      }))
                    }
                    style={{ width: 18, height: 18, accentColor: "#90CAF9" }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: perm.checked ? 600 : 400,
                      color: perm.checked ? "#42A5F5" : "#666",
                    }}
                  >
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
    <div className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-8 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="m-0 text-3xl font-extrabold mb-2">🧩 Role Permissions</h1>
            <p className="m-0 text-white/90">Edit permissions for role: <strong>{role?.name || "Loading..."}</strong></p>
          </div>
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/30 text-white font-semibold hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Quay lại
          </button>
        </div>
      </div>

      {/* Danh sách quyền */}
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="p-8">
          {Object.keys(permissions).map(renderPermissionSection)}

          {/* Footer buttons */}
          <div className="mt-8 pt-6 border-t border-blue-100 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors border border-blue-100"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSavePermissions}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md hover:shadow-lg"
            >
              Cập nhật quyền
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default RolePermissionEdit;
