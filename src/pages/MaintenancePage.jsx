// MaintenancePage.jsx
import React, { useEffect, useState } from 'react';
import { enableMaintenance, disableMaintenance, getMaintenanceStatus } from '../api/maintenanceApi';

export default function MaintenancePage() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await getMaintenanceStatus();
      setEnabled(res.data.maintenance);
    } catch (err) {
      console.error('Failed to get status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleMaintenance = async () => {
    try {
      setLoading(true);
      if (enabled) {
        await disableMaintenance();
      } else {
        await enableMaintenance();
      }
      await fetchStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <h1 className="text-2xl font-bold">Maintenance Mode Management</h1>
      <p className="text-lg">
        Current status: {enabled ? '🛠️ MAINTENANCE' : '✔️ ACTIVE'}
      </p>

      <button
        onClick={toggleMaintenance}
        disabled={loading}
        className={`px-6 py-3 rounded-xl text-white shadow-md text-lg ${
          enabled ? 'bg-green-600' : 'bg-red-600'
        }`}
      >
        {loading ? 'Processing...' : enabled ? 'Disable maintenance' : 'Enable maintenance'}
      </button>
    </div>
  );
}
