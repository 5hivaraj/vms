import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  currentNumber: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
