import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Visitor from '../models/Visitor.js';
import Admin from '../models/Admin.js';
import { protect } from '../middleware/auth.js';
import { getCurrentTokenInfo } from '../services/tokenService.js';
import {
  getTodayDateString,
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
} from '../utils/dateUtils.js';
import {
  exportToExcel,
  exportToPDF,
  fetchVisitorsForExport,
} from '../services/exportService.js';

const router = Router();

router.use(protect);

router.get('/stats', async (_req, res, next) => {
  try {
    const today = getTodayDateString();
    const visitorsToday = await Visitor.countDocuments({
      visitDate: { $gte: getStartOfDay(today), $lte: getEndOfDay(today) },
    });

    const visitorsThisMonth = await Visitor.countDocuments({
      visitDate: { $gte: getStartOfMonth() },
    });

    const tokenInfo = await getCurrentTokenInfo();

    res.json({
      visitorsToday,
      visitorsThisMonth,
      lastToken: tokenInfo.lastToken,
      tokenDate: tokenInfo.date,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/visitors/:id', async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }
    res.json({ visitor });
  } catch (err) {
    next(err);
  }
});

router.get('/visitors', async (req, res, next) => {
  try {
    const { search, date, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { mobile: regex },
        { tokenNumber: regex },
        { company: regex },
      ];
    }

    if (date) {
      query.visitDate = {
        $gte: getStartOfDay(date),
        $lte: getEndOfDay(date),
      };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [visitors, total] = await Promise.all([
      Visitor.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Visitor.countDocuments(query),
    ]);

    res.json({
      visitors,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/accounts', async (_req, res, next) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ admins });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/accounts',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password, name } = req.body;
      const exists = await Admin.findOne({ email: email.toLowerCase() });
      if (exists) {
        return res.status(400).json({ message: 'An admin with this email already exists' });
      }

      const admin = await Admin.create({ email, password, name });
      res.status(201).json({
        message: 'Admin account created',
        admin: { id: admin._id, name: admin.name, email: admin.email },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/export/excel', async (req, res, next) => {
  try {
    const visitors = await fetchVisitorsForExport(req.query);
    const buffer = await exportToExcel(visitors);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename=visitors.xlsx');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

router.get('/export/pdf', async (req, res, next) => {
  try {
    const visitors = await fetchVisitorsForExport(req.query);
    const buffer = await exportToPDF(visitors);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=visitors.pdf');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

export default router;
