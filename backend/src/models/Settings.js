import mongoose from 'mongoose';
import { DEFAULT_INDUCTION_VIDEO_URL } from '../constants/inductionVideo.js';
import { DEFAULT_ASSESSMENT } from '../services/assessmentService.js';
import { DEFAULT_PERMIT_TOKEN } from '../constants/permitToken.js';

const assessmentOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const assessmentQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    options: [assessmentOptionSchema],
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    inductionVideoUrl: {
      type: String,
      default: DEFAULT_INDUCTION_VIDEO_URL,
    },
    inductionVideoType: {
      type: String,
      enum: ['url', 'file'],
      default: 'url',
    },
    assessmentEnabled: {
      type: Boolean,
      default: DEFAULT_ASSESSMENT.assessmentEnabled,
    },
    assessmentTitle: {
      type: String,
      default: DEFAULT_ASSESSMENT.assessmentTitle,
      trim: true,
    },
    assessmentInstructions: {
      type: String,
      default: DEFAULT_ASSESSMENT.assessmentInstructions,
      trim: true,
    },
    assessmentPassingScore: {
      type: Number,
      default: DEFAULT_ASSESSMENT.assessmentPassingScore,
      min: 1,
    },
    assessmentQuestions: {
      type: [assessmentQuestionSchema],
      default: DEFAULT_ASSESSMENT.assessmentQuestions,
    },
    permitLogoUrl: {
      type: String,
      default: DEFAULT_PERMIT_TOKEN.permitLogoUrl,
    },
    permitLogoType: {
      type: String,
      enum: ['url', 'file'],
      default: DEFAULT_PERMIT_TOKEN.permitLogoType,
    },
    permitCompanyName: {
      type: String,
      default: DEFAULT_PERMIT_TOKEN.permitCompanyName,
      trim: true,
    },
    permitLocation: {
      type: String,
      default: DEFAULT_PERMIT_TOKEN.permitLocation,
      trim: true,
    },
    permitTitle: {
      type: String,
      default: DEFAULT_PERMIT_TOKEN.permitTitle,
      trim: true,
    },
    permitFooterLines: {
      type: [String],
      default: DEFAULT_PERMIT_TOKEN.permitFooterLines,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
