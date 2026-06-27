import { getKioskConfig } from '../config/kioskConfig';
import api from '../api/axios';

const getServerBase = () => {
  const apiBaseUrl =
    getKioskConfig().apiBaseUrl || api.defaults.baseURL || import.meta.env.VITE_API_URL || '/api';
  return apiBaseUrl.replace(/\/api\/?$/, '');
};

export const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.startsWith('http://')) {
      try {
        const { pathname } = new URL(url);
        if (pathname.startsWith('/uploads/')) {
          return pathname;
        }
      } catch {
        // fall through
      }
      return url.replace(/^http:\/\//i, 'https://');
    }
    return url;
  }
  return `${getServerBase()}${url}`;
};
