import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');
const videoUploadDir = path.join(uploadDir, 'videos');

export const isS3Enabled = () => process.env.STORAGE_TYPE === 's3';

let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
};

export const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

export const ensureVideoUploadDir = () => {
  ensureUploadDir();
  if (!fs.existsSync(videoUploadDir)) {
    fs.mkdirSync(videoUploadDir, { recursive: true });
  }
  return videoUploadDir;
};

export const uploadPhoto = async (file) => {
  if (isS3Enabled()) {
    const key = `visitors/${file.filename}`;
    const buffer = fs.readFileSync(file.path);
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
      })
    );
    fs.unlinkSync(file.path);
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  return `/uploads/${file.filename}`;
};

export const uploadVideoFile = async (file) => {
  if (isS3Enabled()) {
    const key = `videos/${file.filename}`;
    const buffer = fs.readFileSync(file.path);
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
      })
    );
    fs.unlinkSync(file.path);
    return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  return `/uploads/videos/${file.filename}`;
};

export const deleteLocalMedia = (mediaUrl) => {
  if (!mediaUrl || mediaUrl.startsWith('http')) return;
  const relativePath = mediaUrl.replace(/^\/uploads\//, '');
  const filePath = path.join(uploadDir, relativePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export { uploadDir, videoUploadDir };
