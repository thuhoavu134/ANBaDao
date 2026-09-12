import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveIncomingUrl } from '../src/server/http.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('L82-T1: nested /api/auth rewrite restores original path + oauth query', () => {
  assert.equal(
    resolveIncomingUrl({ url: '/api/oauth?orig=/api/auth/oauth/google' }),
    '/api/auth/oauth/google'
  );
  assert.equal(
    resolveIncomingUrl({ url: '/api/oauth?orig=/api/auth/oauth/google/callback&code=abc&state=st' }),
    '/api/auth/oauth/google/callback?code=abc&state=st'
  );
  assert.equal(resolveIncomingUrl({ url: '/api/health' }), '/api/health');
});

test('L82-T2: vercel rewrites nested auth onto one-segment /api/oauth', () => {
  const conf = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  const hit = (conf.rewrites || []).some(r =>
    r.source === '/api/auth/:path*' && String(r.destination).includes('/api/oauth?orig=/api/auth/:path*')
  );
  assert.equal(hit, true);
});

test('L82-T3: login gate Google+Facebook chuyển trang, không FB.login async', () => {
  const ui = readFileSync(join(root, 'src/ui/login-gate-runtime.js'), 'utf8');
  assert.match(ui, /\/api\/auth\/oauth\/' \+ kind/);
  assert.doesNotMatch(ui, /FB\.login\(async/);
  assert.doesNotMatch(ui, /initCodeClient/);
});
