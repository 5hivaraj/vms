import { isCapacitorNative } from './isCapacitor';

export const tryPrint = () =>
  new Promise((resolve) => {
    if (isCapacitorNative()) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (printed) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('afterprint', onAfterPrint);
      resolve(printed);
    };

    const onAfterPrint = () => finish(true);

    window.addEventListener('afterprint', onAfterPrint);

    try {
      window.print();
    } catch {
      finish(false);
      return;
    }

    window.setTimeout(() => finish(false), 2500);
  });
