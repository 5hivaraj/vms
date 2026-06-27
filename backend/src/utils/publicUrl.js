const getServerProtocol = () => process.env.SERVER_PROTOCOL || 'https';

export const getServerOrigin = (req) => {
  const lanIp = process.env.SERVER_LAN_IP;
  const port = process.env.PORT || 5000;
  const protocol = getServerProtocol();
  if (lanIp) return `${protocol}://${lanIp}:${port}`;
  const host = req.get('host');
  return `${protocol}://${host}`;
};

/** Turn stored full URLs into same-origin paths so HTTPS kiosk can load uploads. */
export const normalizeMediaPath = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const { pathname } = new URL(url);
      if (pathname.startsWith('/uploads/')) return pathname;
    } catch {
      return url;
    }
  }
  return url.startsWith('/') ? url : `/${url}`;
};

export const toPublicMediaUrl = (req, url) => {
  if (!url || url.startsWith('blob:')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const path = normalizeMediaPath(url);
    if (path.startsWith('/uploads/')) return path;
    return url.startsWith('http://')
      ? url.replace(/^http:\/\//i, 'https://')
      : url;
  }
  const mediaPath = normalizeMediaPath(url);
  if (mediaPath.startsWith('/uploads/')) return mediaPath;
  return `${getServerOrigin(req)}${mediaPath}`;
};
