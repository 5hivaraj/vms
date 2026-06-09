import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    inductionVideoUrl: {
      type: String,
      default: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    inductionVideoType: {
      type: String,
      enum: ['url', 'file'],
      default: 'url',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
