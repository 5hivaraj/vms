import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Admin from '../models/Admin.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;
      const admin = await Admin.findOne({ email: email.toLowerCase() });

      if (!admin || !(await admin.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = signToken(admin._id);
      res.json({
        token,
        admin: { id: admin._id, name: admin.name, email: admin.email },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
