import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import selfsigned from 'selfsigned';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certDir = path.resolve(__dirname, '../../.data/certs');
const certPath = path.join(certDir, 'server.crt');
const keyPath = path.join(certDir, 'server.key');
const metaPath = path.join(certDir, 'meta.json');

const getMkcertCa = () => {
  if (process.env.USE_MKCERT === 'false') return null;
  try {
    const caroot = execSync('mkcert -CAROOT', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    const caKeyPath = path.join(caroot, 'rootCA-key.pem');
    const caCertPath = path.join(caroot, 'rootCA.pem');
    if (!fs.existsSync(caKeyPath) || !fs.existsSync(caCertPath)) return null;
    return {
      key: fs.readFileSync(caKeyPath, 'utf8'),
      cert: fs.readFileSync(caCertPath, 'utf8'),
    };
  } catch {
    return null;
  }
};

const buildAltNames = (lanIp) => {
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
  ];
  if (lanIp && lanIp !== '127.0.0.1') {
    altNames.push({ type: 7, ip: lanIp });
  }
  return altNames;
};

const generateCert = async (lanIp) => {
  const altNames = buildAltNames(lanIp);
  const mkcertCa = getMkcertCa();
  const trusted = Boolean(mkcertCa);

  const attrs = [{ name: 'commonName', value: trusted ? 'vms-local' : `vms-${lanIp}` }];
  const options = {
    days: 365,
    keySize: 2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'basicConstraints', cA: false },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
      },
      { name: 'extKeyUsage', serverAuth: true },
      { name: 'subjectAltName', altNames },
    ],
  };

  if (mkcertCa) {
    options.ca = mkcertCa;
  } else {
    options.extensions[0] = { name: 'basicConstraints', cA: true };
    options.extensions[1] = {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    };
    options.extensions[2] = { name: 'extKeyUsage', serverAuth: true, clientAuth: true };
  }

  const pems = await selfsigned.generate(attrs, options);

  fs.mkdirSync(certDir, { recursive: true });
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      { lanIp, trusted, issuer: trusted ? 'mkcert' : 'selfsigned', createdAt: new Date().toISOString() },
      null,
      2
    )
  );

  return trusted;
};

export const getTlsCredentials = async (lanIp = '127.0.0.1') => {
  let meta = null;
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch {
      meta = null;
    }
  }

  const mkcertAvailable = Boolean(getMkcertCa());
  const wantsTrusted = mkcertAvailable && process.env.USE_MKCERT !== 'false';

  const needsRegen =
    !fs.existsSync(certPath) ||
    !fs.existsSync(keyPath) ||
    !meta ||
    meta.lanIp !== lanIp ||
    (wantsTrusted && meta.issuer !== 'mkcert') ||
    (!wantsTrusted && meta.issuer === 'mkcert' && process.env.USE_MKCERT === 'false');

  if (needsRegen) {
    await generateCert(lanIp);
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  }

  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    trusted: meta?.trusted === true,
    issuer: meta?.issuer || 'selfsigned',
  };
};
