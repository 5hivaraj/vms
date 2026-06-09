import api from './axios';

export const login = (email, password) => api.post('/auth/login', { email, password });

export const getStats = () => api.get('/admin/stats');

export const getVisitors = (params) => api.get('/admin/visitors', { params });

export const getVisitor = (id) => api.get(`/admin/visitors/${id}`);

export const getAdminAccounts = () => api.get('/admin/accounts');

export const createAdminAccount = (data) => api.post('/admin/accounts', data);

export const exportExcel = (params) =>
  api.get('/admin/export/excel', { params, responseType: 'blob' });

export const exportPDF = (params) =>
  api.get('/admin/export/pdf', { params, responseType: 'blob' });
