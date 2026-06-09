import { useCallback, useEffect, useRef, useState } from 'react';

const VIDEO_CONSTRAINTS = [
  { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
  { video: { facingMode: 'user' }, audio: false },
  { video: true, audio: false },
];

const getErrorMessage = (err) => {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera permission denied. Tap "Open Camera" and choose Allow when prompted.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera found on this device. Please connect a webcam.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Camera is in use by another app. Close other apps and try again.';
    case 'SecurityError':
      return 'Camera requires a secure connection (HTTPS or localhost).';
    default:
      return 'Unable to access camera. Tap Open Camera to try again.';
  }
};

const requestStream = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('Camera not supported'), { name: 'NotSupportedError' });
  }

  let lastError;
  for (const constraints of VIDEO_CONSTRAINTS) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastError = err;
      if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') {
        throw err;
      }
    }
  }
  throw lastError;
};

const waitForVideoElement = (videoRef, maxAttempts = 20) =>
  new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      if (videoRef.current) {
        resolve(videoRef.current);
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error('Video element not ready'));
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });

export const useCamera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const startingRef = useRef(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    if (startingRef.current || streamRef.current) return;

    startingRef.current = true;
    setIsStarting(true);
    setError(null);
    setIsReady(false);

    try {
      const stream = await requestStream();
      streamRef.current = stream;

      const video = await waitForVideoElement(videoRef);
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await video.play();
      setIsReady(true);
    } catch (err) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setError(getErrorMessage(err));
      setIsReady(false);
    } finally {
      startingRef.current = false;
      setIsStarting(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return Promise.resolve(null);

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return { videoRef, error, isReady, isStarting, startCamera, stopCamera, capturePhoto };
};
