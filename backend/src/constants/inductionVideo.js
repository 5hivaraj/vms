export const DEFAULT_INDUCTION_VIDEO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export const LEGACY_BROKEN_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

import { normalizeMediaPath } from '../utils/publicUrl.js';

export const normalizeInductionVideoUrl = (url) => {
  const fromLegacy =
    url === LEGACY_BROKEN_VIDEO_URL ? DEFAULT_INDUCTION_VIDEO_URL : url;
  return normalizeMediaPath(fromLegacy) || fromLegacy;
};

export const repairInductionVideoSettings = async (settings) => {
  const normalized = normalizeInductionVideoUrl(settings.inductionVideoUrl);
  if (normalized !== settings.inductionVideoUrl) {
    settings.inductionVideoUrl = normalized;
    await settings.save();
  }
  return settings;
};
