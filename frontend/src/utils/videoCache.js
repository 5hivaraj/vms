import { isCapacitorNative } from './isCapacitor';

const DB_NAME = 'vms-kiosk-cache';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const CACHE_KEY = 'induction';

const openDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

const readCache = async () => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(CACHE_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

const writeCache = async (entry) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(entry, CACHE_KEY);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getCachedOrDownloadVideo = async (remoteUrl, version) => {
  if (!remoteUrl) throw new Error('Video URL is missing');

  if (!isCapacitorNative()) {
    return remoteUrl;
  }

  const cacheVersion = version || remoteUrl;
  const cached = await readCache();

  if (cached?.version === cacheVersion && cached.blob) {
    return URL.createObjectURL(cached.blob);
  }

  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error('Failed to download induction video');
  }

  const blob = await response.blob();
  await writeCache({
    version: cacheVersion,
    url: remoteUrl,
    blob,
    cachedAt: Date.now(),
  });

  return URL.createObjectURL(blob);
};

export const revokeVideoObjectUrl = (objectUrl) => {
  if (objectUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(objectUrl);
  }
};
