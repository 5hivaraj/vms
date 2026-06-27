import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';
import { uploadVideo } from '../middleware/videoUpload.js';
import { deleteLocalMedia, uploadBrandingLogo, uploadVideoFile } from '../config/s3.js';
import { repairInductionVideoSettings } from '../constants/inductionVideo.js';
import {
  formatAssessmentForAdmin,
  repairAssessmentSettings,
  validateAssessmentConfig,
} from '../services/assessmentService.js';
import { repairPermitSettings } from '../constants/permitToken.js';
import {
  formatPermitForAdmin,
  validatePermitConfig,
} from '../services/permitService.js';
import { uploadLogo } from '../middleware/logoUpload.js';

const router = Router();

const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  } else {
    settings = await repairInductionVideoSettings(settings);
    settings = await repairAssessmentSettings(settings);
    settings = await repairPermitSettings(settings);
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

router.get('/assessment', protect, async (_req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(formatAssessmentForAdmin(settings));
  } catch (err) {
    next(err);
  }
});

router.put('/assessment', protect, async (req, res, next) => {
  try {
    const questions = req.body.assessmentQuestions || [];
    const payload = {
      assessmentEnabled:
        questions.length > 0 ? Boolean(req.body.assessmentEnabled) : false,
      assessmentTitle: (req.body.assessmentTitle || '').trim(),
      assessmentInstructions: (req.body.assessmentInstructions || '').trim(),
      assessmentPassingScore: Number(req.body.assessmentPassingScore) || 1,
      assessmentQuestions: questions,
    };

    if (questions.length > 0 && !payload.assessmentEnabled) {
      return res.status(400).json({
        message: 'Enable assessment on kiosk when saving questions',
      });
    }

    const { valid, errors } = validateAssessmentConfig(payload);
    if (!valid) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const settings = await getOrCreateSettings();
    settings.assessmentEnabled = payload.assessmentEnabled;
    settings.assessmentTitle = payload.assessmentTitle || 'Safety Assessment';
    settings.assessmentInstructions =
      payload.assessmentInstructions || 'Answer all questions correctly to continue.';
    settings.assessmentPassingScore = payload.assessmentPassingScore;
    settings.assessmentQuestions = payload.assessmentQuestions;
    await settings.save();

    res.json(formatAssessmentForAdmin(settings));
  } catch (err) {
    next(err);
  }
});

router.get('/permit', protect, async (_req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(formatPermitForAdmin(settings));
  } catch (err) {
    next(err);
  }
});

router.put('/permit', protect, async (req, res, next) => {
  try {
    const payload = {
      permitLogoUrl: (req.body.permitLogoUrl || '').trim(),
      permitLogoType: req.body.permitLogoType === 'file' ? 'file' : 'url',
      permitCompanyName: (req.body.permitCompanyName || '').trim(),
      permitLocation: (req.body.permitLocation || '').trim(),
      permitTitle: (req.body.permitTitle || '').trim(),
      permitFooterLines: req.body.permitFooterLines || [],
    };

    const { valid, errors, permitFooterLines } = validatePermitConfig(payload);
    if (!valid) {
      return res.status(400).json({ message: errors[0], errors });
    }

    const settings = await getOrCreateSettings();

    if (payload.permitLogoType === 'url' && settings.permitLogoType === 'file') {
      deleteLocalMedia(settings.permitLogoUrl);
    }

    settings.permitCompanyName = payload.permitCompanyName;
    settings.permitLocation = payload.permitLocation;
    settings.permitTitle = payload.permitTitle;
    settings.permitFooterLines = permitFooterLines;
    if (payload.permitLogoType === 'url') {
      settings.permitLogoUrl = payload.permitLogoUrl;
      settings.permitLogoType = 'url';
    }
    await settings.save();

    res.json(formatPermitForAdmin(settings));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/permit/logo/upload',
  protect,
  uploadLogo.single('logo'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Logo image is required' });
      }

      const settings = await getOrCreateSettings();

      if (settings.permitLogoType === 'file') {
        deleteLocalMedia(settings.permitLogoUrl);
      }

      const logoUrl = await uploadBrandingLogo(req.file);
      settings.permitLogoUrl = logoUrl;
      settings.permitLogoType = 'file';
      await settings.save();

      res.json({
        message: 'Permit logo uploaded',
        ...formatPermitForAdmin(settings),
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
