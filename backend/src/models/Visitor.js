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
    visitDate: { type: Date, required: true },
  },
  { timestamps: true }
);

visitorSchema.index({ name: 'text', mobile: 'text', tokenNumber: 'text' });
visitorSchema.index({ visitDate: -1 });
visitorSchema.index({ tokenNumber: 1, visitDate: 1 });

export default mongoose.model('Visitor', visitorSchema);
