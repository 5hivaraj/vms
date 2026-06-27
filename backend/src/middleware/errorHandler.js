export const errorHandler = (err, _req, res, _next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate entry' });
  }

  if (
    err.message === 'Only image files are allowed' ||
    err.message === 'Only MP4, WebM, or MOV video files are allowed'
  ) {
    return res.status(400).json({ message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'Video file is too large (max 200MB)' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
};
