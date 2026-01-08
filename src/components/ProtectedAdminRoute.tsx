// src/components/ProtectedAdminRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getrole } from '../api/maintenanceApi';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children, allowedRoles }) => {
  const [roles, setRoles] = useState<string[] | null>(null); // null = loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getrole();
        setRoles(res.data.data || []); // <-- Lấy đúng array
        console.log(res.data.data);
      } catch (err) {
        console.error('Lỗi khi lấy role:', err);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  if (loading) return null; // hoặc spinner

  const hasAccess = roles!.some((role) => allowedRoles.includes(role));

  return <>{children}</>;
};

export default ProtectedAdminRoute;
