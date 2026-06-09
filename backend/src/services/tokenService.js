import Counter from '../models/Counter.js';
import { getTodayDateString, formatTokenNumber } from '../utils/dateUtils.js';

export const generateToken = async () => {
  const today = getTodayDateString();

  const counter = await Counter.findOneAndUpdate(
    { date: today },
    { $inc: { currentNumber: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return formatTokenNumber(counter.currentNumber);
};

export const getCurrentTokenInfo = async () => {
  const today = getTodayDateString();
  const counter = await Counter.findOne({ date: today });
  return {
    date: today,
    currentNumber: counter?.currentNumber || 0,
    lastToken: counter?.currentNumber ? formatTokenNumber(counter.currentNumber) : null,
  };
};
