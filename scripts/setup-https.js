import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const certDir = path.join(root, 'backend/.data/certs');

const hasMkcert = () => {
  try {
    execSync('mkcert -CAROOT', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

console.log('VMS local HTTPS setup\n');

if (!hasMkcert()) {
  console.log('mkcert is not installed. The server still runs HTTPS with a self-signed certificate.');
  console.log('Browsers will show a security warning — click Advanced → Proceed once per device.\n');
  console.log('For trusted HTTPS (no warning), install mkcert:');
  console.log('  Windows (Chocolatey):  choco install mkcert');
  console.log('  Windows (Scoop):       scoop install mkcert');
  console.log('  macOS:                 brew install mkcert');
  console.log('  Linux:                 see https://github.com/FiloSottile/mkcert#installation\n');
  console.log('Then run:  npm run setup:https');
  process.exit(0);
}

console.log('Installing mkcert local CA (may ask for admin approval)...');
const install = spawnSync('mkcert', ['-install'], { stdio: 'inherit', shell: true });
if (install.status !== 0) {
  console.error('\nmkcert -install failed. Run it manually in an elevated terminal.');
  process.exit(install.status || 1);
}

if (fs.existsSync(certDir)) {
  for (const file of fs.readdirSync(certDir)) {
    fs.unlinkSync(path.join(certDir, file));
  }
  console.log('\nRemoved old certificates — they will be regenerated on next server start.');
}

console.log('\nTrusted local HTTPS is ready.');
console.log('Restart the server:  npm run restart:server');
console.log('Then open:           https://localhost:5000');
