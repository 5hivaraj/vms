import api from './axios';

export const getVideoSettings = () => api.get('/settings/video');

export const updateVideoSettings = (inductionVideoUrl) =>
  api.put('/settings/video', { inductionVideoUrl });

export const uploadVideoFile = (file) => {
  const formData = new FormData();
  formData.append('video', file);
  return api.post('/settings/video/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getAssessmentSettings = () => api.get('/settings/assessment');

export const updateAssessmentSettings = (payload) => api.put('/settings/assessment', payload);
