import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../../hooks/useCamera';
import { useKiosk } from '../../context/KioskContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SelfieCapture() {
  const navigate = useNavigate();
  const { videoRef, error, isReady, isStarting, startCamera, stopCamera, capturePhoto } =
    useCamera();
  const { photoPreview, setPhoto } = useKiosk();
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState(photoPreview);
  const [cameraActive, setCameraActive] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const startCameraRef = useRef(startCamera);
  startCameraRef.current = startCamera;

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (!cameraActive || preview) return;
    const timer = setTimeout(() => startCameraRef.current(), 200);
    return () => clearTimeout(timer);
  }, [cameraActive, preview, restartKey]);

  const requestCamera = () => {
    stopCamera();
    setCameraActive(true);
    setRestartKey((k) => k + 1);
  };

  const handleOpenCamera = () => {
    requestCamera();
  };

  const handleCapture = async () => {
    setCapturing(true);
    const blob = await capturePhoto();
    if (blob) {
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setPhoto(blob, url);
      stopCamera();
    }
    setCapturing(false);
  };

  const handleRetake = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhoto(null, null);
    requestCamera();
  };

  const handleContinue = () => {
    navigate('/register');
  };

  const showCameraPrompt = !preview && !cameraActive;
  const showCameraError = !preview && cameraActive && error && !isStarting;

  if (showCameraPrompt) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <span className="text-6xl mb-6">📷</span>
        <h2 className="text-kiosk font-bold mb-4">Take Your Photo</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-lg">
          Tap the button below to open the camera. When prompted, select <strong>Allow</strong>.
        </p>
        <button type="button" onClick={handleOpenCamera} className="btn-kiosk-primary min-w-[280px]">
          Open Camera
        </button>
      </div>
    );
  }

  if (showCameraError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <span className="text-6xl mb-6">📷</span>
        <h2 className="text-kiosk font-bold mb-4">Camera Error</h2>
        <p className="text-xl text-red-600 dark:text-red-400 mb-8 max-w-lg">{error}</p>
        <button type="button" onClick={requestCamera} className="btn-kiosk-primary min-w-[280px]">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col px-6 py-8">
      <h2 className="text-kiosk font-bold text-center mb-2">Take Your Photo</h2>
      <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-8">
        Position your face in the frame
      </p>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
          {preview ? (
            <img src={preview} alt="Captured selfie" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
                autoPlay
                playsInline
                muted
              />
              {(!isReady || isStarting) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900/80">
                  <LoadingSpinner size="lg" />
                  <p className="text-lg text-gray-300">Starting camera...</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          {!preview ? (
            <button
              type="button"
              onClick={handleCapture}
              disabled={!isReady || capturing || isStarting}
              className="btn-kiosk-primary min-w-[280px]"
            >
              {capturing ? 'Capturing...' : 'Capture Photo'}
            </button>
          ) : (
            <>
              <button type="button" onClick={handleRetake} className="btn-kiosk-secondary min-w-[200px]">
                Retake
              </button>
              <button type="button" onClick={handleContinue} className="btn-kiosk-primary min-w-[200px]">
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
