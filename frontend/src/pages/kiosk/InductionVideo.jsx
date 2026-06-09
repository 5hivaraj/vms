import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInductionVideo } from '../../api/visitors';
import { useKiosk } from '../../context/KioskContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function InductionVideo() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const maxWatchedRef = useRef(0);
  const { setInductionCompleted } = useKiosk();
  const { showToast } = useToast();
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  useEffect(() => {
    getInductionVideo()
      .then((res) => setVideoUrl(resolveMediaUrl(res.data.inductionVideoUrl)))
      .catch(() => showToast('Failed to load induction video', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    maxWatchedRef.current = 0;

    const handleTimeUpdate = () => {
      if (video.currentTime > maxWatchedRef.current + 0.5) {
        video.currentTime = maxWatchedRef.current;
      } else {
        maxWatchedRef.current = Math.max(maxWatchedRef.current, video.currentTime);
      }
    };

    const handleSeeking = () => {
      if (video.currentTime > maxWatchedRef.current) {
        video.currentTime = maxWatchedRef.current;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeking', handleSeeking);
    video.play().catch(() => {});

    const el = containerRef.current;
    if (el?.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeking', handleSeeking);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [videoUrl]);

  const handleEnded = () => {
    setVideoEnded(true);
    setInductionCompleted(true);
  };

  const handleContinue = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    navigate('/selfie');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden"
      style={{
        width: '100vw',
        height: '100dvh',
        minHeight: '100vh',
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        controls={false}
        playsInline
        onEnded={handleEnded}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 sm:px-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center">
          Safety Induction
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-white/80 text-center mt-2">
          Please watch the complete video before continuing
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-12 sm:px-8">
        <div className="flex flex-col items-center gap-3 sm:gap-4 max-w-lg mx-auto w-full">
          {!videoEnded && (
            <p className="text-sm sm:text-base md:text-lg text-amber-300 font-medium text-center">
              Video must finish before you can continue
            </p>
          )}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!videoEnded}
            className="w-full sm:w-auto sm:min-w-[280px] min-h-[56px] sm:min-h-[72px] px-8 py-4 text-lg sm:text-2xl font-bold rounded-2xl transition-all
              bg-blue-600 text-white hover:bg-blue-700 active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
              focus:outline-none focus:ring-4 focus:ring-blue-500/50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
