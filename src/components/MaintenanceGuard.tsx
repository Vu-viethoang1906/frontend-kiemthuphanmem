// src/components/MaintenanceGuard.tsx
import React, { useEffect, useState } from 'react';
import MaintenancePage from '../pages/MaintenancePage';
import { getMaintenanceStatus } from '../api/maintenanceApi';

const MaintenanceGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getMaintenanceStatus();
        // API trả về { maintenance: true/false }
        setMaintenance(response.data.maintenance);
      } catch (error) {
        console.error('Lỗi khi lấy trạng thái bảo trì:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) return null; // Hoặc spinner

  return <>{children}</>;
};

export default MaintenanceGuard;
