import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Visitor from '../models/Visitor.js';
import { upload } from '../middleware/upload.js';
import { uploadPhoto } from '../config/s3.js';
import { generateToken } from '../services/tokenService.js';
import { getTodayDateString, getStartOfDay, getEndOfDay } from '../utils/dateUtils.js';

const router = Router();

router.get('/settings/video', async (_req, res, next) => {
  try {
    const Settings = (await import('../models/Settings.js')).default;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({
      inductionVideoUrl: settings.inductionVideoUrl,
      inductionVideoType: settings.inductionVideoType,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/register',
  upload.single('photo'),
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
    body('company').trim().notEmpty().withMessage('Company name is required'),
    body('purpose').optional().trim(),
    body('inductionCompleted').optional().isBoolean(),
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
