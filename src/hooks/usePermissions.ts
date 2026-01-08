import { useState, useEffect } from "react";
import { getRolebyIdUser } from "../api/role&permission";
import { fetchAllRolePermission } from "../api/role&permission";

interface Permission {
  _id: string;
  code: string;
}

interface RolePermission {
  role_id: { _id: string } | string;
  permission_id: { _id: string; code: string } | string;
}

/**
 * Hook để load và cache permissions của user hiện tại
 * @returns {
 *   permissions: string[] - Danh sách permission codes
 *   loading: boolean - Trạng thái loading
 *   hasPermission: (code: string) => boolean - Check permission
 *   hasAnyPermission: (codes: string[]) => boolean - Check có ít nhất 1 permission
 *   hasAllPermissions: (codes: string[]) => boolean - Check có tất cả permissions
 * }
 */
export const usePermissions = () => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const userId = localStorage.getItem("userId");

        // 🔥 FALLBACK: Nếu user là admin, cho phép tất cả
        const rolesString = localStorage.getItem("roles") || "[]";

        let userRoleNames: string[] = [];
        try {
          userRoleNames = JSON.parse(rolesString);
        } catch (e) {
          console.warn("⚠️ Parse roles failed, trying split:", e);
          userRoleNames = rolesString.split(",").filter((r) => r);
        }

        const isAdmin =
          userRoleNames.includes("admin") ||
          userRoleNames.includes("System_Manager");
        if (isAdmin) {
          // Cho phép tất cả permissions
          setPermissions(["*"]); // Wildcard permission
          setLoading(false);
          return;
        }
        if (!userId) {
          setPermissions([]);
          setLoading(false);
          return;
        }

        let rolesResp;
        try {
          rolesResp = await getRolebyIdUser(userId);
        } catch (apiError) {
          console.error("❌ API getRolebyIdUser failed:", apiError);
          setPermissions([]);
          setLoading(false);
          return;
        }

        const userRoles = rolesResp?.data || [];

        if (userRoles.length === 0) {
          console.warn("⚠️ User không có roles trong database");

          // 🔥 FALLBACK: Nếu localStorage có role nhưng DB không có
          // Có thể do user mới tạo hoặc data chưa sync
          if (userRoleNames.length > 0) {
            console.warn(
              "⚠️ Fallback: Sử dụng role từ localStorage:",
              userRoleNames
            );
            // Tạm thời cho empty permissions, admin cần gán role trong DB
            setPermissions([]);
          } else {
            setPermissions([]);
          }

          setLoading(false);
          return;
        }

        const roleIds = userRoles.map((r: any) => r._id).filter(Boolean);
        // 2. Lấy tất cả role-permission mapping
        const rolePermResp = await fetchAllRolePermission();
        const allRolePermsRaw: RolePermission[] = rolePermResp?.data || [];

        // 🔥 FILTER: Loại bỏ records có role_id hoặc permission_id null
        const allRolePerms = allRolePermsRaw.filter((rp) => {
          return rp.role_id && rp.permission_id;
        });

        // 3. Filter permissions của user
        const userPermissionCodes = new Set<string>();
        let matchCount = 0;

        allRolePerms.forEach((rp, index) => {
          const roleId =
            typeof rp.role_id === "object" ? rp.role_id._id : rp.role_id;
          const permissionId = rp.permission_id;

          // Debug: Log first match
          if (roleIds.includes(roleId) && matchCount === 0) {
            matchCount++;
          }

          if (roleIds.includes(roleId) && permissionId) {
            const code =
              typeof permissionId === "object" ? permissionId.code : "";
            if (code) {
              userPermissionCodes.add(code);
            }
          }
        });

        const finalPermissions = Array.from(userPermissionCodes);

        // 🔥 FALLBACK: Nếu không có permissions, log chi tiết
        if (finalPermissions.length === 0) {
          console.error("❌ Không tìm thấy permissions cho user!");
        }

        setPermissions(finalPermissions);
      } catch (error) {
        console.error("❌ Lỗi khi load permissions:", error);
        console.error("❌ Error details:", error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  // Helper functions
  const hasPermission = (code: string): boolean => {
    // Wildcard: admin có tất cả quyền
    if (permissions.includes("*")) return true;
    return permissions.includes(code);
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    // Wildcard: admin có tất cả quyền
    if (permissions.includes("*")) return true;
    return codes.some((code) => permissions.includes(code));
  };

  const hasAllPermissions = (codes: string[]): boolean => {
    // Wildcard: admin có tất cả quyền
    if (permissions.includes("*")) return true;
    return codes.every((code) => permissions.includes(code));
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
