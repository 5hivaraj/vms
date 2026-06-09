import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';
import { uploadVideo } from '../middleware/videoUpload.js';
import { deleteLocalMedia, uploadVideoFile } from '../config/s3.js';

const router = Router();

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

const formatSettings = (settings) => ({
  inductionVideoUrl: settings.inductionVideoUrl,
  inductionVideoType: settings.inductionVideoType,
});

router.get('/video', protect, async (_req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(formatSettings(settings));
  } catch (err) {
    next(err);
  }
});

router.put(
  '/video',
  protect,
  [body('inductionVideoUrl').trim().notEmpty().withMessage('Video URL is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const settings = await getOrCreateSettings();

      if (settings.inductionVideoType === 'file') {
        deleteLocalMedia(settings.inductionVideoUrl);
      }

      settings.inductionVideoUrl = req.body.inductionVideoUrl;
      settings.inductionVideoType = 'url';
      await settings.save();

      res.json(formatSettings(settings));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/video/upload',
  protect,
  uploadVideo.single('video'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Video file is required' });
      }

      const settings = await getOrCreateSettings();

      if (settings.inductionVideoType === 'file') {
        deleteLocalMedia(settings.inductionVideoUrl);
      }

      const videoUrl = await uploadVideoFile(req.file);
      settings.inductionVideoUrl = videoUrl;
      settings.inductionVideoType = 'file';
      await settings.save();

      res.json({
        message: 'Induction video uploaded',
        ...formatSettings(settings),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
