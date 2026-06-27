import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const port = 5000;

const pickLanIp = () => {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      if (!addr.address.startsWith('192.168.') && !addr.address.startsWith('10.') && !addr.address.startsWith('172.')) continue;
      const score =
        (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wifi') ? 10 : 0) +
        (name.toLowerCase().includes('ethernet') ? 8 : 0) -
        (name.includes('*') ? 5 : 0);
      candidates.push({ ip: addr.address, name, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.ip || '127.0.0.1';
};

const lanIp = pickLanIp();
const apiBaseUrl = `https://${lanIp}:${port}/api`;
const serverUrl = `https://${lanIp}:${port}`;

const serverConfig = { lanIp, port, apiBaseUrl, serverUrl };
fs.writeFileSync(path.join(root, 'server.config.json'), JSON.stringify(serverConfig, null, 2) + '\n');

const kioskConfig = { apiBaseUrl, kioskOnly: true };
const kioskConfigJson = JSON.stringify(kioskConfig, null, 2) + '\n';
fs.writeFileSync(path.join(root, 'frontend/public/kiosk-config.json'), kioskConfigJson);
fs.writeFileSync(path.join(root, 'frontend/src/config/kiosk-config.bundled.json'), kioskConfigJson);

const envPath = path.join(root, 'backend/.env');
let env = fs.readFileSync(envPath, 'utf8');

const setEnv = (key, value) => {
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, 'm').test(env)) {
    env = env.replace(new RegExp(`^${key}=.*$`, 'm'), line);
  } else {
    env += `\n${line}`;
  }
};

setEnv('SERVER_LAN_IP', lanIp);
setEnv('SERVER_PROTOCOL', 'https');
setEnv(
  'FRONTEND_URL',
  `http://localhost:5173,https://localhost:5173,${serverUrl},http://localhost,https://localhost,capacitor://localhost`
);
fs.writeFileSync(envPath, env);

console.log('LAN configuration updated:');
console.log(JSON.stringify(serverConfig, null, 2));
