// AppWrapper.tsx
import React, { useEffect, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import App from "./App";
import { useNavigate, useLocation } from "react-router-dom";
import { getMe } from "./api/authApi";

const AppWrapper = () => {
  const { initialized, keycloak } = useKeycloak();
  const [ready, setReady] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();


useEffect(() => {
  if (hasChecked || !initialized) return;

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    const currentPath = location.pathname;
    
    // Đợi React Router parse URL đúng trước khi check
    if (currentPath === "/" && window.location.pathname !== "/") {
      return; // Chưa parse xong, đợi lần chạy tiếp theo
    }

    // Nếu chưa có token và không phải đăng nhập Keycloak → quay lại login
    if (!token && localStorage.getItem("Type_login") !== "SSO") {
      if (currentPath !== "/login" && currentPath !== "/login-codegym") {
        navigate("/login", { replace: true });
      }
      setReady(true);
      setHasChecked(true);
      return;
    }

    let roles: string[] = [];

    try {
      // 🕓 Chờ 1 chút để đảm bảo Keycloak đã có token
      if (localStorage.getItem("Type_login") === "SSO" && !keycloak?.token) {
     
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const res = await getMe(); // Gọi API backend (có Authorization header)
      roles = res?.data?.roles || [];
      if (roles.length === 0) roles = ["user"];
      localStorage.setItem("roles", JSON.stringify(roles));
    } catch (err) {
      console.error("Lấy thông tin user thất bại:", err);
      roles = ["user"];
    }

    const allowedAdminRoles = ["admin", "System_Manager"];
    const isAdmin = roles.some((r) => allowedAdminRoles.includes(r));

    // ✅ Chỉ redirect khi ở trang login, không redirect root hoặc các route khác
    // Để React Router xử lý root route (/) trong App.tsx
    if (currentPath === "/login" || currentPath === "/login-codegym") {
      
      navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
    } else {
    
    }

    setReady(true);
    setHasChecked(true);
  };

  checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialized, keycloak?.token, hasChecked, location.pathname]);



  // Không chặn render nữa, để React Router có thể parse URL
  // if (!ready) {
  //   return (
  //     <div style={{ textAlign: "center", marginTop: "50px" }}>
  //       Đang kiểm tra đăng nhập...
  //     </div>
  //   );
  // }

  return <App />;
};

export default AppWrapper;
