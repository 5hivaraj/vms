import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const defaultDbPath = () => {
  if (process.env.MONGODB_DATA_PATH) {
    return path.resolve(process.env.MONGODB_DATA_PATH);
  }
  if (process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'vms', 'mongodb');
  }
  return path.resolve(__dirname, '../../.data/mongodb');
};

export const getListeningPids = (port) => {
  const pids = new Set();
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, {
        encoding: 'utf8',
      });
      for (const line of out.split('\n')) {
        const pid = Number(line.trim().split(/\s+/).pop());
        if (pid > 0) pids.add(pid);
      }
      return [...pids];
    }
    const out = execSync(`lsof -ti :${port} -sTCP:LISTEN`, { encoding: 'utf8' });
    return out
      .split('\n')
      .map((n) => Number(n.trim()))
      .filter((n) => n > 0);
  } catch {
    return [];
  }
};

export const isPortListening = (port) => getListeningPids(port).length > 0;

export const killPid = (pid) => {
  if (!pid || pid === process.pid) return false;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
    }
    return true;
  } catch {
    return false;
  }
};

export const getMongoPids = () => {
  try {
    if (process.platform === 'win32') {
      const out = execSync('tasklist /NH', { encoding: 'utf8' });
      const pids = [];
      for (const line of out.split('\n')) {
        const match = line.match(/^mongod\S*\s+(\d+)/i);
        if (match) pids.push(Number(match[1]));
      }
      return pids;
    }
    const out = execSync('pgrep -x mongod', { encoding: 'utf8' });
    return out
      .split('\n')
      .map((n) => Number(n.trim()))
      .filter((n) => n > 0);
  } catch {
    return [];
  }
};

export const killMongoProcesses = () => {
  let stopped = 0;
  for (const pid of getMongoPids()) {
    if (killPid(pid)) stopped += 1;
  }
  return stopped;
};

export const clearMongoLockFiles = (dbPath = defaultDbPath()) => {
  let cleared = 0;
  for (const file of ['mongod.lock', 'WiredTiger.lock']) {
    const lockPath = path.join(dbPath, file);
    if (!fs.existsSync(lockPath)) continue;
    try {
      fs.rmSync(lockPath);
      cleared += 1;
    } catch {
      // still locked
    }
  }
  return cleared;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const stopVmsServer = async (port = Number(process.env.PORT) || 5000) => {
  const actions = [];

  for (const pid of getListeningPids(port)) {
    if (killPid(pid)) {
      actions.push(`Stopped process on port ${port} (PID ${pid})`);
    }
  }

  const mongoStopped = killMongoProcesses();
  if (mongoStopped > 0) {
    actions.push(`Stopped ${mongoStopped} MongoDB process(es)`);
  }

  await sleep(800);

  const locksCleared = clearMongoLockFiles();
  if (locksCleared > 0) {
    actions.push(`Cleared ${locksCleared} stale lock file(s)`);
  }

  return actions;
};

export const prepareMongoDataDir = async (dbPath = defaultDbPath()) => {
  const port = Number(process.env.PORT) || 5000;

  if (isPortListening(port)) {
    return { ok: false, reason: 'server_running', port };
  }

  const mongoPids = getMongoPids();
  if (mongoPids.length > 0) {
    killMongoProcesses();
    await sleep(800);
  }

  clearMongoLockFiles(dbPath);
  fs.mkdirSync(dbPath, { recursive: true });
  return { ok: true };
};
