import multer from 'multer';
import path from 'path';
import { ensureVideoUploadDir } from '../config/s3.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ensureVideoUploadDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `induction-${Date.now()}${ext}`);
  },
});

const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

const fileFilter = (_req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only MP4, WebM, or MOV video files are allowed'), false);
  }
};

export const uploadVideo = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 },
});
