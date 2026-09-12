import { createApp } from './app.mjs';
import { createStoreFromEnv } from './store.mjs';

let cached;

async function getHandle() {
  if (cached) return cached;
  const store = await createStoreFromEnv(process.env);
  const secret = process.env.AUTH_SECRET || process.env.HONVIET_AUTH_SECRET || 'hon-viet-dev-secret-change-me';
  const publicBase = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  cached = createApp({
    store,
    secret,
    publicBase,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || '',
      appSecret: process.env.FACEBOOK_APP_SECRET || ''
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || '',
      teamId: process.env.APPLE_TEAM_ID || '',
      keyId: process.env.APPLE_KEY_ID || ''
    }
  });
  return cached;
}

function originOf(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  if (process.env.PUBLIC_BASE_URL) return String(process.env.PUBLIC_BASE_URL).replace(/\/+$/, '');
  if (host) return String(proto).split(',')[0].trim() + '://' + String(host).split(',')[0].trim();
  return '';
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) && !ArrayBuffer.isView(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks.map(c => Buffer.isBuffer(c) ? c : Buffer.from(c))).toString('utf8');
  if (!raw) return {};
  const ctype = String((req.headers && (req.headers['content-type'] || req.headers['Content-Type'])) || '');
  if (ctype.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  try { return JSON.parse(raw); } catch { return {}; }
}

export async function handleNode(req, res) {
  const handle = await getHandle();
  const result = await handle(req.method, req.url || '/', {
    body: await readBody(req),
    headers: req.headers || {},
    origin: originOf(req)
  });
  if (result.redirect) {
    res.statusCode = result.status || 302;
    res.setHeader('Location', result.redirect);
    res.setHeader('Cache-Control', 'no-store');
    res.end();
    return;
  }
  res.statusCode = result.status || 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(result.json || {}));
}

export async function handleVercel(req, res) {
  return handleNode(req, res);
}

export default handleVercel;
