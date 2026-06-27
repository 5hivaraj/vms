import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCamera } from '../../hooks/useCamera';
import { useKiosk } from '../../context/KioskContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SelfieCapture() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const { videoRef, error, isReady, isStarting, startCamera, stopCamera, capturePhoto } =
    useCamera();
  const {
    photoPreview,
    setPhoto,
    inductionCompleted,
    assessmentPassed,
    assessmentSkipped,
  } = useKiosk();
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState(photoPreview);
  const startCameraRef = useRef(startCamera);
  startCameraRef.current = startCamera;

  useEffect(() => {
    if (!inductionCompleted) {
      navigate('/induction', { replace: true });
      return;
    }
    if (!assessmentSkipped && !assessmentPassed) {
      navigate('/assessment', { replace: true });
    }
  }, [inductionCompleted, assessmentPassed, assessmentSkipped, navigate]);

  useEffect(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }

    return () => {
      stopCamera();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [stopCamera]);

  useEffect(() => {
    if (preview) return;
    const timer = setTimeout(() => startCameraRef.current(), 100);
    return () => clearTimeout(timer);
  }, [preview]);

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
  };

  const handleContinue = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate('/register');
  };

  const handleRetry = () => {
    stopCamera();
    setTimeout(() => startCameraRef.current(), 100);
  };

  const showError = error && !preview && !isStarting;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden"
      style={{ width: '100vw', height: '100dvh', minHeight: '100vh' }}
    >
      {preview ? (
        <img src={preview} alt="Captured selfie" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            autoPlay
            playsInline
            muted
          />
          {(!isReady || isStarting) && !showError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/80">
              <LoadingSpinner size="xl" />
              <p className="text-lg sm:text-xl text-white/80">Starting camera...</p>
            </div>
          )}
          {showError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/90 px-6 text-center">
              <span className="text-6xl">📷</span>
              <p className="text-lg text-red-400 max-w-lg">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="px-10 py-5 text-xl font-bold rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}
        </>
      )}

      <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 sm:px-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center">
          Take Your Photo
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-white/80 text-center mt-2">
          {preview ? 'Review your photo' : 'Position your face in the frame'}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-12 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto w-full">
          {!preview ? (
            <button
              type="button"
              onClick={handleCapture}
              disabled={!isReady || capturing || isStarting}
              className="w-full sm:w-auto sm:min-w-[280px] min-h-[56px] sm:min-h-[72px] px-8 py-4 text-lg sm:text-2xl font-bold rounded-2xl transition-all
                bg-blue-600 text-white hover:bg-blue-700 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
                focus:outline-none focus:ring-4 focus:ring-blue-500/50"
            >
              {capturing ? 'Capturing...' : 'Capture Photo'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="w-full sm:w-auto sm:min-w-[200px] min-h-[56px] sm:min-h-[64px] px-8 py-4 text-lg sm:text-xl font-bold rounded-2xl
                  bg-white/15 text-white hover:bg-white/25 active:scale-95"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="w-full sm:w-auto sm:min-w-[200px] min-h-[56px] sm:min-h-[64px] px-8 py-4 text-lg sm:text-xl font-bold rounded-2xl
                  bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
              >
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
