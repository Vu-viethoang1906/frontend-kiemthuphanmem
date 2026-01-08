// maintenanceApi.js
import axios from 'axios';

const API_BASE = 'http://localhost:3005'; // đổi theo backend của bạn

export const enableMaintenance = async () => {
  return axios.post(`${API_BASE}/admin/maintenance/enable`);
};

export const disableMaintenance = async () => {
  return axios.post(`${API_BASE}/admin/maintenance/disable`);
};

export const getMaintenanceStatus = async () => {
  return axios.get(`${API_BASE}/admin/maintenance/status`);
};

export const getrole = async () => {
  return axios.get(`${API_BASE}/api/role/my-role`);
};
