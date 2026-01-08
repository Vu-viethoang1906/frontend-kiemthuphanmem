import { useKeycloak } from "@react-keycloak/web";

import { useEffect, useState } from "react";
import { getKeycloakUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
export const useAuth = () => {
  const { keycloak, initialized } = useKeycloak();

  const [userInfo, setUserInfo] = useState<any>(null);
 const navigate = useNavigate();   // 👈 thêm navigate
  // Đăng nhập
  const login = async () => {
    try {
      await keycloak.login();
      if (keycloak.token) {
        localStorage.setItem("token", keycloak.token);
        localStorage.setItem("refreshToken", keycloak.refreshToken || "");
        localStorage.setItem("Type_login", "SSO");
        // Lấy thông tin user từ Keycloak
        const userId = keycloak.tokenParsed?.sub;
        if (userId) {
          try {
            const user = await getKeycloakUser(userId);
            setUserInfo(user);
            localStorage.setItem("userInfo", JSON.stringify(user));
          } catch (err) {
            console.error("Lấy thông tin user từ Keycloak thất bại:", err);
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Login thất bại:", err);
      return false;
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      if (localStorage.getItem("Type_login") === "SSO") {
        await keycloak.logout();
      }
      localStorage.clear();
      setUserInfo(null);
      

      // 👇 ép về trang login
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("❌ Logout thất bại:", err);
    }
  };

  // Tự động lấy thông tin user nếu đã đăng nhập SSO
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (keycloak.authenticated && keycloak.tokenParsed?.sub) {
        try {
          const user = await getKeycloakUser(keycloak.tokenParsed.sub);
          setUserInfo(user);
          localStorage.setItem("userInfo", JSON.stringify(user));
        } catch (err) {
          console.error("Lấy thông tin user từ Keycloak thất bại:", err);
        }
      }
    };
    fetchUserInfo();
  }, [keycloak.authenticated, keycloak.tokenParsed?.sub]);

  return {
    initialized,
    authenticated: keycloak.authenticated,
    token: keycloak.token,
    username: keycloak.tokenParsed?.preferred_username || "",
    login,
    logout,
    userInfo,
  };
};