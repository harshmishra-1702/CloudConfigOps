import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getDashboardStats = async () => {
  try {
    const res = await api.get('/dashboard/stats');
    return res.data;
  } catch (error) {
    await delay(500);
    return { totalResources: 47, activeDriftAlerts: 3, complianceScore: 94, mttr: '4.2m' };
  }
};

export const getDriftAlerts = async () => {
  try {
    const res = await api.get('/dashboard/drift-alerts');
    return res.data;
  } catch (error) {
    await delay(500);
    return [
      { id: 1, resource: 'sg-0a1b2c3d4e', type: 'Security Group', severity: 'CRITICAL', timeAgo: '10m', expected: 'port 22 closed', actual: 'port 22 open (0.0.0.0/0)' },
      { id: 2, resource: 's3-customer-data', type: 'S3 Bucket', severity: 'HIGH', timeAgo: '1h', expected: 'encryption AES256', actual: 'unencrypted' },
      { id: 3, resource: 'i-0abcd1234ef', type: 'EC2 Instance', severity: 'MEDIUM', timeAgo: '3h', expected: 't3.micro', actual: 't3.large' },
      { id: 4, resource: 'role-prod-admin', type: 'IAM Role', severity: 'HIGH', timeAgo: '5h', expected: 'Read Only', actual: 'AdministratorAccess' },
      { id: 5, resource: 'db-prod-main', type: 'RDS Instance', severity: 'LOW', timeAgo: '1d', expected: 'auto-minor-version-upgrade true', actual: 'false' },
    ];
  }
};

export const getRecentDeployments = async () => {
  try {
    const res = await api.get('/dashboard/deployments');
    return res.data;
  } catch (error) {
    await delay(500);
    return [
      { id: 1, environment: 'Production', config: 'nginx.conf', deployedBy: 'Alice Chen', status: 'success', timestamp: '2 mins ago' },
      { id: 2, environment: 'Staging', config: '.env.staging', deployedBy: 'Bob Smith', status: 'success', timestamp: '1 hour ago' },
      { id: 3, environment: 'Production', config: 'docker-compose.yml', deployedBy: 'Alice Chen', status: 'pending', timestamp: 'In progress' },
      { id: 4, environment: 'Development', config: 'base.env', deployedBy: 'System', status: 'failed', timestamp: '3 hours ago' },
      { id: 5, environment: 'Staging', config: 'security-headers.conf', deployedBy: 'Carol Wong', status: 'success', timestamp: '1 day ago' },
    ];
  }
};

export const getConfigItems = async () => {
  try {
    const res = await api.get('/configs');
    return res.data;
  } catch (error) {
    await delay(300);
    return [];
  }
};

export const getConfigItem = async (id: string) => {
  try {
    const res = await api.get(`/configs/${id}`);
    return res.data;
  } catch (error) {
    await delay(300);
    return { id, content: '' };
  }
};

export const createConfigItem = async (data: any) => api.post('/configs', data);
export const updateConfigItem = async (id: string, data: any) => api.put(`/configs/${id}`, data);
export const deleteConfigItem = async (id: string) => api.delete(`/configs/${id}`);
export const getConfigHistory = async (id: string) => api.get(`/configs/${id}/history`);
export const getChangeRequests = async () => {
  try {
    const res = await api.get('/change-requests');
    return res.data;
  } catch (error) {
    await delay(500);
    return [];
  }
};
export const createChangeRequest = async (data: any) => api.post('/change-requests', data);
export const approveChangeRequest = async (id: string, comment: string) => api.post(`/change-requests/${id}/approve`, { comment });
export const rejectChangeRequest = async (id: string, comment: string) => api.post(`/change-requests/${id}/reject`, { comment });
export const deployChangeRequest = async (id: string) => api.post(`/change-requests/${id}/deploy`);

export const login = async (email: string, password: string) => api.post('/auth/login', { email, password });
export const register = async (data: any) => api.post('/auth/register', data);
