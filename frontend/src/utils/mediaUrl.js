const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url}`;
};
