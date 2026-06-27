import api from './axios';

export const getPermitSettings = () => api.get('/settings/permit');

export const updatePermitSettings = (payload) => api.put('/settings/permit', payload);

export const uploadPermitLogo = (file) => {
  const formData = new FormData();
  formData.append('logo', file);
  return api.post('/settings/permit/logo/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
