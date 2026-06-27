import api from './axios';

export const getInductionVideo = () => api.get('/kiosk/settings/video');

export const getPermitSettings = () => api.get('/kiosk/settings/permit');

export const getAssessment = () => api.get('/kiosk/assessment');

export const submitAssessment = (answers) =>
  api.post('/kiosk/assessment/submit', { answers });

export const registerVisitor = (formData) =>
  api.post('/kiosk/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getTodayCount = () => api.get('/kiosk/today-count');
