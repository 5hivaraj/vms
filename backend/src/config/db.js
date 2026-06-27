import mongoose from 'mongoose';
import {
  defaultDbPath,
  prepareMongoDataDir,
} from '../utils/serverProcess.js';

const localDbPath = defaultDbPath();

let memoryServer;

const useMemoryDb = () => {
  const uri = process.env.MONGODB_URI || '';
  return process.env.USE_MEMORY_DB === 'true' || uri === 'memory';
};

export const connectDB = async () => {
  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/vms';

  if (useMemoryDb()) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const prep = await prepareMongoDataDir(localDbPath);
    if (!prep.ok && prep.reason === 'server_running') {
      const lan = process.env.SERVER_LAN_IP;
      const port = prep.port;
      const hint = lan ? `https://${lan}:${port}` : `https://localhost:${port}`;
      throw new Error(
        `VMS server is already running at ${hint}. Use that URL, or run: npm run stop:server`
      );
    }
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'vms',
        dbPath: localDbPath,
      },
      binary: { version: process.env.MONGOMS_VERSION || '7.0.14' },
    });
    uri = memoryServer.getUri('vms');
    console.log(`Using local MongoDB (data: ${localDbPath})`);
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
};
