import api from './axios';

export const getInductionVideo = () => api.get('/kiosk/settings/video');

export const registerVisitor = (formData) =>
  api.post('/kiosk/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getTodayCount = () => api.get('/kiosk/today-count');
