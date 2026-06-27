import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Visitor from '../models/Visitor.js';
import { upload } from '../middleware/upload.js';
import { uploadPhoto } from '../config/s3.js';
import { generateToken } from '../services/tokenService.js';
import { getTodayDateString, getStartOfDay, getEndOfDay } from '../utils/dateUtils.js';
import { repairInductionVideoSettings } from '../constants/inductionVideo.js';
import Settings from '../models/Settings.js';
import {
  allQuestionsAnswered,
  formatAssessmentForKiosk,
  repairAssessmentSettings,
  scoreAssessment,
} from '../services/assessmentService.js';
import { repairPermitSettings } from '../constants/permitToken.js';
import { formatPermitForKiosk } from '../services/permitService.js';
import { toPublicMediaUrl } from '../utils/publicUrl.js';

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

router.get('/settings/video', async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      inductionVideoUrl: toPublicMediaUrl(req, settings.inductionVideoUrl),
      inductionVideoType: settings.inductionVideoType,
      videoVersion: settings.updatedAt?.toISOString?.() || settings.inductionVideoUrl,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/settings/permit', async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(formatPermitForKiosk(req, settings));
  } catch (err) {
    next(err);
  }
});

router.get('/assessment', async (_req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(formatAssessmentForKiosk(settings));
  } catch (err) {
    next(err);
  }
});

router.post('/assessment/submit', async (req, res, next) => {
  try {
    const settings = await getOrCreateSettings();

    if (!settings.assessmentEnabled) {
      return res.json({ enabled: false, passed: true, score: 0, total: 0, answers: [] });
    }

    const answers = req.body.answers;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers are required' });
    }

    if (!allQuestionsAnswered(settings, answers)) {
      return res.status(400).json({ message: 'Please answer all questions' });
    }

    const result = scoreAssessment(settings, answers);
    res.json({ enabled: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/register',
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('mobile')
      .trim()
      .notEmpty()
      .withMessage('Mobile number is required')
      .matches(/^\d{10}$/)
      .withMessage('Mobile number must be exactly 10 digits'),
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('purpose').optional().trim(),
    body('inductionCompleted').optional().isBoolean(),
    body('assessmentPassed').optional(),
    body('assessmentScore').optional(),
    body('assessmentTotal').optional(),
    body('assessmentAnswers').optional(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Photo is required' });
      }

      const settings = await getOrCreateSettings();
      let assessmentPassed = null;
      let assessmentScore = 0;
      let assessmentTotal = 0;
      let assessmentAnswers = [];

      if (settings.assessmentEnabled) {
        let parsedAnswers = [];
        if (req.body.assessmentAnswers) {
          try {
            parsedAnswers =
              typeof req.body.assessmentAnswers === 'string'
                ? JSON.parse(req.body.assessmentAnswers)
                : req.body.assessmentAnswers;
          } catch {
            return res.status(400).json({ message: 'Invalid assessment answers' });
          }
        }

        if (!allQuestionsAnswered(settings, parsedAnswers)) {
          return res.status(400).json({ message: 'Assessment must be completed before check-in' });
        }

        const result = scoreAssessment(settings, parsedAnswers);
        if (!result.passed) {
          return res.status(400).json({ message: 'Assessment not passed. Please try again.' });
        }

        assessmentPassed = true;
        assessmentScore = result.score;
        assessmentTotal = result.total;
        assessmentAnswers = result.answers;
      }

      const photoUrl = await uploadPhoto(req.file);
      const tokenNumber = await generateToken();
      const today = getTodayDateString();

      const visitor = await Visitor.create({
        tokenNumber,
        name: req.body.name,
        mobile: req.body.mobile,
        company: req.body.company,
        purpose: req.body.purpose || '',
        photoUrl,
        inductionCompleted: req.body.inductionCompleted !== 'false',
        assessmentPassed,
        assessmentScore,
        assessmentTotal,
        assessmentAnswers,
        visitDate: new Date(today),
      });

      res.status(201).json({
        message: 'Visitor registered successfully',
        visitor: {
          id: visitor._id,
          tokenNumber: visitor.tokenNumber,
          name: visitor.name,
          mobile: visitor.mobile,
          company: visitor.company,
          purpose: visitor.purpose,
          photoUrl: visitor.photoUrl,
          visitDate: visitor.visitDate,
          createdAt: visitor.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/today-count', async (_req, res, next) => {
  try {
    const today = getTodayDateString();
    const count = await Visitor.countDocuments({
      visitDate: {
        $gte: getStartOfDay(today),
        $lte: getEndOfDay(today),
      },
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

export default router;
