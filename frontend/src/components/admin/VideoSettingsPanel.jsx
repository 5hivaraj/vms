import { useCallback, useEffect, useState } from 'react';
import { getVideoSettings, updateVideoSettings, uploadVideoFile } from '../../api/settings';
import { useToast } from '../../hooks/useToast';
import { resolveMediaUrl } from '../../utils/mediaUrl';

export default function VideoSettingsPanel() {
  const { showToast } = useToast();
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState('url');
  const [mode, setMode] = useState('url');
  const [selectedFile, setSelectedFile] = useState(null);
  const [savingUrl, setSavingUrl] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await getVideoSettings();
      setVideoUrl(data.inductionVideoUrl);
      setVideoType(data.inductionVideoType || 'url');
      setMode(data.inductionVideoType === 'file' ? 'file' : 'url');
    } catch {
      showToast('Failed to load video settings', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveUrl = async () => {
    if (!videoUrl.trim()) {
      showToast('Please enter a video URL', 'error');
      return;
    }
    setSavingUrl(true);
    try {
      const { data } = await updateVideoSettings(videoUrl.trim());
      setVideoType(data.inductionVideoType);
      showToast('Video URL saved', 'success');
      loadSettings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save video URL', 'error');
    } finally {
      setSavingUrl(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast('Please choose a video file', 'error');
      return;
    }
    setUploading(true);
    try {
      const { data } = await uploadVideoFile(selectedFile);
      setVideoUrl(data.inductionVideoUrl);
      setVideoType(data.inductionVideoType);
      setSelectedFile(null);
      showToast('Video file uploaded', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload video', 'error');
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = resolveMediaUrl(videoUrl);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-xl font-semibold mb-1">Induction Video Settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Use a video URL or upload a file (MP4, WebM, MOV — max 200MB). Kiosk visitors will see
        this after tapping Start.
      </p>

      <div className="flex gap-2 mb-6">
        <ModeButton active={mode === 'url'} onClick={() => setMode('url')}>
          Video URL
        </ModeButton>
        <ModeButton active={mode === 'file'} onClick={() => setMode('file')}>
          Upload File
        </ModeButton>
      </div>

      {mode === 'url' ? (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="https://example.com/induction-video.mp4"
          />
          <button
            type="button"
            onClick={handleSaveUrl}
            disabled={savingUrl}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 shrink-0"
          >
            {savingUrl ? 'Saving...' : 'Save URL'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300"
          />
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 shrink-0"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>
      )}

      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current video</p>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              videoType === 'file'
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            }`}
          >
            {videoType === 'file' ? 'Uploaded file' : 'External URL'}
          </span>
        </div>
        {previewUrl ? (
          <video
            key={previewUrl}
            src={previewUrl}
            controls
            className="w-full max-h-64 rounded-lg bg-black"
          />
        ) : (
          <p className="text-sm text-gray-500">No video configured</p>
        )}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
