import { isCapacitorNative } from '../utils/isCapacitor';
import bundledKioskConfig from './kiosk-config.bundled.json';

const MANUAL_API_KEY = 'kioskManualApiBaseUrl';
const DEFAULT_PORT = 5000;

const defaults = {
  apiBaseUrl:
    bundledKioskConfig.apiBaseUrl || import.meta.env.VITE_API_URL || '/api',
};

let config = { ...defaults };

export const buildApiBaseUrl = (ip, port = DEFAULT_PORT) => {
  const trimmed = ip.trim();
  if (!trimmed) return '';

  let host = trimmed.replace(/^https?:\/\//, '').replace(/\/api\/?$/, '').replace(/\/$/, '');
  if (!host.includes(':')) {
    host = `${host}:${port}`;
  }

  return `https://${host}/api`;
};

export const parseApiBaseUrl = (apiBaseUrl) => {
  const match = apiBaseUrl?.match(/^https?:\/\/([^/]+)/);
  if (!match) return { ip: '', port: String(DEFAULT_PORT) };

  const [ip, port] = match[1].includes(':') ? match[1].split(':') : [match[1], String(DEFAULT_PORT)];
  return { ip, port };
};

export const getManualApiBaseUrl = () => {
  try {
    return localStorage.getItem(MANUAL_API_KEY) || '';
  } catch {
    return '';
  }
};

export const setManualApiBaseUrl = (apiBaseUrl) => {
  try {
    if (apiBaseUrl) {
      localStorage.setItem(MANUAL_API_KEY, apiBaseUrl);
      config = { apiBaseUrl };
    } else {
      localStorage.removeItem(MANUAL_API_KEY);
      config = { ...defaults };
    }
  } catch {
    config = apiBaseUrl ? { apiBaseUrl } : { ...defaults };
  }
};

export const loadKioskConfig = async () => {
  if (isCapacitorNative()) {
    const manual = getManualApiBaseUrl();
    if (manual) {
      config = { apiBaseUrl: manual };
      return config;
    }

    try {
      const response = await fetch('/kiosk-config.json', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data.apiBaseUrl) {
          config = { apiBaseUrl: data.apiBaseUrl };
          return config;
        }
      }
    } catch {
      // Fall back to the API URL baked in at build time.
    }

    config = { ...defaults };
    return config;
  }

  // Browser (PC website + admin) always talks to the same server via /api.
  config = { apiBaseUrl: import.meta.env.VITE_API_URL || '/api' };
  return config;
};

export const getKioskConfig = () => config;

export const getActiveApiBaseUrl = () => getManualApiBaseUrl() || config.apiBaseUrl || defaults.apiBaseUrl;

/** Hide admin routes only in the Android kiosk APK build, not in a normal browser. */
export const isKioskApp = () =>
  isCapacitorNative() || import.meta.env.VITE_KIOSK_APP === 'true';

export const isDeveloperSettingsAvailable = () => isCapacitorNative();
