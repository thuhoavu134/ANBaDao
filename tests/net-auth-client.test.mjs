import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(join(root, rel), 'utf8');

test('L74-T1: wrap renderNet + netAuth, hide server field, add Google button', () => {
  const ui = read('src/ui/net-auth-runtime.js');
  assert.match(ui, /const baseRender = renderNet/);
  assert.match(ui, /renderNet = function/);
  assert.match(ui, /const baseAuth = netAuth/);
  assert.match(ui, /location\.origin/);
  assert.match(ui, /net_code/);
  assert.match(ui, /\/api\/auth\/oauth\/google/);
  assert.match(ui, /\/api\/auth\/oauth\/exchange/);
  assert.doesNotMatch(ui, /document\.addEventListener\(['"]click['"]/);
  assert.doesNotMatch(ui, /campaign-scene/);
  const css = read('src/ui/net-auth.css');
  assert.match(css, /#netServer/);
  assert.match(css, /display:\s*none/);
  assert.match(css, /hv-net-google/);
});

test('L74-T6: do not edit frozen shells', () => {
  const html = read('index.html');
  assert.match(html, /async function netAuth\(kind\)/);
  assert.match(html, /function renderNet\(\)/);
  assert.match(html, /mong-gioi-server\.js/);
  assert.doesNotMatch(html, /hv-net-google/);
  assert.doesNotMatch(html, /\/api\/auth\/oauth\/google/);
  const battle = read('battle.html');
  assert.doesNotMatch(battle, /createApp|net-auth-runtime/);
  assert.equal(existsSync(join(root, 'src/ui/campaign-scene.js')), true);
  assert.doesNotMatch(read('src/ui/campaign-scene.js'), /createApp|net-auth-runtime/);
});

test('L74-T7: one Vercel project gateway + lane stub', () => {
  const api = read('api/[...path].js');
  assert.match(api, /handleVercel|createApp|from ['\"]\.\.\/src\/server\/http\.mjs['\"]/);
  const stub = read('scripts/lanes/tkt-0074-auth.mjs');
  assert.match(stub, /LANE = 'TKT-0074'/);
  assert.match(stub, /await import\(['"]\.\.\/net-auth-v1\.mjs['"]\)/);
  const build = read('scripts/build-static.mjs');
  assert.match(build, /overlay-safari-hotfix-v1\.mjs[\s\S]*lanes\/tkt-0074-auth\.mjs/);
  const hits = build.split('./lanes/tkt-0074-auth.mjs').length - 1;
  assert.equal(hits, 1);
  const vercel = read('vercel.json');
  assert.match(vercel, /"outputDirectory": "dist"/);
  assert.doesNotMatch(vercel, /mong-gioi-server/);
});
