import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    tokenNumber: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    purpose: { type: String, default: '', trim: true },
    photoUrl: { type: String, required: true },
    inductionCompleted: { type: Boolean, default: true },
    assessmentPassed: { type: Boolean, default: null },
    assessmentScore: { type: Number, default: 0 },
    assessmentTotal: { type: Number, default: 0 },
    assessmentAnswers: {
      type: [
        {
          questionId: String,
          selectedOptionId: String,
          correct: Boolean,
        },
      ],
      default: [],
    },
    visitDate: { type: Date, required: true },
  },
  { timestamps: true }
);

visitorSchema.index({ name: 'text', mobile: 'text', tokenNumber: 'text' });
visitorSchema.index({ visitDate: -1 });
visitorSchema.index({ tokenNumber: 1, visitDate: 1 });

export default mongoose.model('Visitor', visitorSchema);
