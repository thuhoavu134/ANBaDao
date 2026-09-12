import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);

function scryptParams() {
  const test = Boolean(process.env.NODE_TEST_CONTEXT);
  return { N: test ? 1024 : 16384, r: 8, p: 1, keylen: 32 };
}

export function randomId(bytes = 16) {
  return randomBytes(bytes).toString('hex');
}

export function b64url(value) {
  return Buffer.from(value).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function b64urlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  return Buffer.from(padded, 'base64');
}

export async function hashPassword(pass) {
  const { N, r, p, keylen } = scryptParams();
  const salt = randomBytes(16);
  const hash = await scrypt(String(pass), salt, keylen, { N, r, p });
  return `${salt.toString('hex')}:${Buffer.from(hash).toString('hex')}:${N}`;
}

export async function verifyPassword(pass, packed) {
  if (!packed || typeof packed !== 'string') return false;
  const [saltHex, hashHex, nRaw] = packed.split(':');
  if (!saltHex || !hashHex) return false;
  const N = Number(nRaw) || scryptParams().N;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const { r, p, keylen } = scryptParams();
  const actual = await scrypt(String(pass), salt, expected.length || keylen, { N, r, p });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function signToken(payload, secret, now = Date.now(), ttlMs = 1000 * 60 * 60 * 24 * 30) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, iat: Math.floor(now / 1000), exp: Math.floor((now + ttlMs) / 1000) }));
  const sig = b64url(createHmac('sha256', secret).update(header + '.' + body).digest());
  return header + '.' + body + '.' + sig;
}

export function verifyToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || token.split('.').length !== 3) return null;
  const [header, body, sig] = token.split('.');
  const expected = b64url(createHmac('sha256', secret).update(header + '.' + body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(now / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function usernameFromEmail(email, fallbackPrefix = 'g') {
  const local = String(email || '').split('@')[0] || '';
  let cleaned = local.replace(/[^A-Za-z0-9_]/g, '').slice(0, 16);
  if (cleaned.length < 3) cleaned = (fallbackPrefix + randomId(4)).slice(0, 16);
  if (!/^[A-Za-z]/.test(cleaned)) cleaned = 'g' + cleaned.slice(0, 15);
  return cleaned.slice(0, 16);
}
