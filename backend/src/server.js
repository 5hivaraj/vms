import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from './config/db.js';
import { getTlsCredentials } from './config/tls.js';
import { ensureDevData } from './config/ensureDevData.js';
import { ensureUploadDir } from './config/s3.js';
import authRoutes from './routes/auth.js';
import visitorRoutes from './routes/visitors.js';
import settingsRoutes from './routes/settings.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;
const HTTP_REDIRECT_PORT = Number(process.env.HTTP_REDIRECT_PORT) || PORT + 1;
const HTTP_REDIRECT_FALLBACK_PORTS = [HTTP_REDIRECT_PORT, 5001, 8080];

ensureUploadDir();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
      if (origin === 'capacitor://localhost') return callback(null, true);
      if (/^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return callback(null, true);
      if (/^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/kiosk', visitorRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use(errorHandler);

const useMemoryDb =
  process.env.USE_MEMORY_DB === 'true' || process.env.MONGODB_URI === 'memory';

let httpServer;
let redirectServer;
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${signal} received, shutting down...`);
  try {
    if (redirectServer) {
      await new Promise((resolve) => redirectServer.close(resolve));
    }
    if (httpServer) {
      await new Promise((resolve) => httpServer.close(resolve));
    }
    await disconnectDB();
  } catch (err) {
    console.error('Shutdown error:', err.message);
  }
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
if (process.platform === 'win32') {
  process.on('SIGBREAK', () => shutdown('SIGBREAK'));
}

connectDB()
  .then(async () => {
    if (useMemoryDb) {
      await ensureDevData();
    }
    const lanIp = process.env.SERVER_LAN_IP || '127.0.0.1';
    const { cert, key, trusted, issuer } = await getTlsCredentials(lanIp);

    httpServer = https.createServer({ cert, key }, app);
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} (HTTPS)`);
      console.log(`  Local:   https://localhost:${PORT}`);
      if (lanIp && lanIp !== '127.0.0.1') {
        console.log(`  LAN:     https://${lanIp}:${PORT}`);
        console.log(`  API:     https://${lanIp}:${PORT}/api/health`);
        console.log(`  Kiosk:   Android APK → https://${lanIp}:${PORT}/api`);
      }
      if (trusted) {
        console.log(`  TLS:     Trusted (${issuer}) — no browser certificate warning`);
      } else {
        console.log('  TLS:     Self-signed — accept the certificate warning once per browser');
        console.log('  Tip:     npm run setup:https  →  trusted local HTTPS (mkcert)');
      }
      console.log('  Note:    Camera on this PC works on https://localhost without extra setup.');
      if (lanIp && lanIp !== '127.0.0.1') {
        console.log(`           Tablet/phone kiosk must use https://${lanIp}:${PORT} (not http).`);
      }
    });

    const startHttpRedirect = (ports, index = 0) => {
      if (index >= ports.length) {
        console.warn('  HTTP redirect unavailable. Always open https:// directly.');
        return;
      }
      const redirectPort = ports[index];
      redirectServer = http.createServer((req, res) => {
        const host = req.headers.host?.split(':')[0] || 'localhost';
        const target = `https://${host}:${PORT}${req.url || '/'}`;
        res.writeHead(301, { Location: target });
        res.end();
      });
      redirectServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          redirectServer = undefined;
          startHttpRedirect(ports, index + 1);
          return;
        }
        console.error('HTTP redirect server error:', err.message);
      });
      redirectServer.listen(redirectPort, '0.0.0.0', () => {
        console.log(`  HTTP redirect: http://${lanIp || 'localhost'}:${redirectPort} → HTTPS`);
      });
    };

    startHttpRedirect(HTTP_REDIRECT_FALLBACK_PORTS.filter((p, i, a) => a.indexOf(p) === i));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
