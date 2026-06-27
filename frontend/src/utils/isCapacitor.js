export const isCapacitorNative = () =>
  typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
